import express from 'express';
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

      // No active week exists, create one
      if (activeWeeks.length === 0) {
        return await prisma.week.create({
          data: { isActive: true },
        });
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

// Get all nominations for the active week
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

// Add a nomination
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { tmdbMovieId, title, posterUrl } = req.body;

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
    const nominationId = parseInt(req.params.id);

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

// Admin: End the current week
router.post('/cycle-week', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Mark all active weeks as inactive
    await prisma.week.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Week ended successfully. A new week will begin automatically.' });
  } catch (error) {
    console.error('Error cycling week:', error);
    res.status(500).json({ error: 'Failed to end the week' });
  }
});

export default router;
