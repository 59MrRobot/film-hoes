import express from 'express';
// Force backend restart
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// In-memory lock to prevent race conditions during simultaneous requests
let activeWeekPromise: Promise<any> | null = null;

// Helper to get or create the active week, while self-healing any duplicates
async function getActiveWeek() {
  if (activeWeekPromise) return activeWeekPromise;

  activeWeekPromise = (async () => {
    try {
      const activeWeeks = await prisma.week.findMany({
        where: { isActive: true },
        orderBy: { id: 'asc' }, // Keep the oldest one as primary
      });

      // No active week exists, throw error
      if (activeWeeks.length === 0) {
        throw new Error("No active week currently exists");
      }

      // Duplicates exist, self-heal the database
      if (activeWeeks.length > 1) {
        const primaryWeek = activeWeeks[0];
        const duplicateIds = activeWeeks.slice(1).map((w) => w.id);

        // Move all nominations from duplicate weeks into the primary week
        await prisma.nomination.updateMany({
          where: { weekId: { in: duplicateIds } },
          data: { weekId: primaryWeek.id },
        });

        // Delete the duplicate weeks
        await prisma.week.deleteMany({
          where: { id: { in: duplicateIds } },
        });

        return primaryWeek;
      }

      // Exactly one active week exists
      return activeWeeks[0];
    } finally {
      // Release the lock
      activeWeekPromise = null;
    }
  })();

  return activeWeekPromise;
}

// Get the latest week (active or ended) and its nominations
router.get('/latest', async (req, res) => {
  try {
    const latestWeek = await prisma.week.findFirst({
      orderBy: { id: 'desc' },
      include: {
        nominations: {
          include: {
            user: { select: { id: true, username: true } },
            votes: true,
          }
        }
      }
    });
    res.json(latestWeek || null);
  } catch (error) {
    console.error('Error fetching latest week:', error);
    res.status(500).json({ error: 'Failed to fetch latest week' });
  }
});

// Get all nominations for the active week (legacy endpoint)
router.get('/', async (req, res) => {
  try {
    const week = await getActiveWeek();

    const nominations = await prisma.nomination.findMany({
      where: { weekId: week.id },
      include: {
        user: {
          select: { id: true, username: true },
        },
        votes: true,
      },
    });

    res.json(nominations);
  } catch (error) {
    console.error('Error fetching nominations:', error);
    res.status(500).json({ error: 'Failed to fetch nominations' });
  }
});

// Get historical weeks
router.get('/history', async (req, res) => {
  try {
    const latestWeek = await prisma.week.findFirst({ orderBy: { id: 'desc' } });

    const historicalWeeks = await prisma.week.findMany({
      where: { 
        isActive: false,
        ...(latestWeek ? { id: { not: latestWeek.id } } : {})
      },
      include: {
        nominations: {
          include: {
            user: {
              select: { id: true, username: true },
            },
            votes: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
    res.json(historicalWeeks);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { tmdbMovieId, title, posterUrl, backdropUrl } = req.body;

    if (!tmdbMovieId || !title) {
      return res.status(400).json({ error: 'Movie ID and title are required' });
    }

    const week = await getActiveWeek();

    // Check if the user already has 2 nominations this week (we can limit it later, but let's say they can nominate multiple? User said "we all nominate two movies to watch")
    const userNominations = await prisma.nomination.count({
      where: { weekId: week.id, userId },
    });

    if (userNominations >= 2) {
      return res.status(400).json({ error: 'You have already nominated 2 movies this week' });
    }

    // Check if the movie is already nominated
    const existingNomination = await prisma.nomination.findFirst({
      where: { weekId: week.id, tmdbMovieId },
    });

    if (existingNomination) {
      return res.status(400).json({ error: 'This movie is already nominated this week' });
    }

    const nomination = await prisma.nomination.create({
      data: {
        weekId: week.id,
        userId,
        tmdbMovieId,
        title,
        posterUrl,
        backdropUrl,
      },
      include: {
        user: { select: { id: true, username: true } },
        votes: true,
      }
    });

    res.status(201).json(nomination);
  } catch (error) {
    console.error('Error adding nomination:', error);
    res.status(500).json({ error: 'Failed to add nomination' });
  }
});

// Delete a nomination (only allowed if it belongs to the user and has no votes, or no votes exist this week)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const nominationId = parseInt(req.params.id as string);

    const nomination = await prisma.nomination.findUnique({
      where: { id: nominationId },
      include: { votes: true },
    });

    if (!nomination) {
      return res.status(404).json({ error: 'Nomination not found' });
    }

    if (nomination.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own nominations' });
    }

    // Check if voting has started globally for the week (or just on this nomination)
    // The user requested: "only available if the voting has not been done started yet"
    // We will check if ANY votes exist for the current week
    const week = await getActiveWeek();
    const totalVotesThisWeek = await prisma.vote.count({
      where: {
        nomination: {
          weekId: week.id
        }
      }
    });

    if (totalVotesThisWeek > 0) {
      return res.status(400).json({ error: 'Cannot replace nomination after voting has started' });
    }

    await prisma.nomination.delete({
      where: { id: nominationId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting nomination:', error);
    res.status(500).json({ error: 'Failed to delete nomination' });
  }
});

// Get current active week info
router.get('/active-week', async (req, res) => {
  try {
    const week = await getActiveWeek();
    res.json(week);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active week' });
  }
});

// Update current active week theme (Admin only)
router.put('/active-week/theme', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user!.isAdmin) {
      return res.status(403).json({ error: 'Only admins can set the theme' });
    }
    const { theme } = req.body;
    const week = await getActiveWeek();
    const updatedWeek = await prisma.week.update({
      where: { id: week.id },
      data: { theme },
    });
    res.json(updatedWeek);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

// Admin: End the current week
router.post('/end-week', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user!.isAdmin) {
      return res.status(403).json({ error: 'Only admins can end the week' });
    }

    // Mark all active weeks as inactive
    await prisma.week.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Week ended successfully.' });
  } catch (error) {
    console.error('Error ending week:', error);
    res.status(500).json({ error: 'Failed to end the week' });
  }
});

// Admin: Start a new week
router.post('/start-week', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user!.isAdmin) {
      return res.status(403).json({ error: 'Only admins can start a week' });
    }

    const { theme } = req.body;
    if (!theme) {
      return res.status(400).json({ error: 'Theme is required to start a week' });
    }

    // Mark any straggling active weeks inactive just in case
    await prisma.week.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const newWeek = await prisma.week.create({
      data: { isActive: true, theme },
    });

    res.json({ success: true, newWeek });
  } catch (error) {
    console.error('Error starting week:', error);
    res.status(500).json({ error: 'Failed to start the week' });
  }
});

export default router;
