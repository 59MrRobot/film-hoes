import express from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Helper to get or create the active week
async function getActiveWeek() {
  let week = await prisma.week.findFirst({
    where: { isActive: true },
  });

  if (!week) {
    week = await prisma.week.create({
      data: {
        isActive: true,
      },
    });
  }

  return week;
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

export default router;
