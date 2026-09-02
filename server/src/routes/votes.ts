import express from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Helper to get active week
async function getActiveWeek() {
  return await prisma.week.findFirst({
    where: { isActive: true },
  });
}

// Cast a vote
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { nominationId } = req.body;

    if (!nominationId) {
      return res.status(400).json({ error: 'Nomination ID is required' });
    }

    const week = await getActiveWeek();
    if (!week) {
      return res.status(400).json({ error: 'No active week found' });
    }

    // 1. Get the nomination and verify it's in the current week
    const nomination = await prisma.nomination.findUnique({
      where: { id: nominationId },
    });

    if (!nomination || nomination.weekId !== week.id) {
      return res.status(404).json({ error: 'Nomination not found in the current week' });
    }

    // 2. Rule: Cannot vote for your own nomination
    if (nomination.userId === userId) {
      return res.status(400).json({ error: 'You cannot vote for your own nomination' });
    }

    // 3. Rule: Check if already voted for this nomination
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_nominationId: {
          userId,
          nominationId,
        },
      },
    });

    if (existingVote) {
      // Toggle vote off if they click again
      await prisma.vote.delete({
        where: { id: existingVote.id },
      });
      return res.json({ message: 'Vote removed' });
    }

    // 4. Rule: Max 2 votes per week
    const userVotesThisWeek = await prisma.vote.count({
      where: {
        userId,
        nomination: {
          weekId: week.id,
        },
      },
    });

    if (userVotesThisWeek >= 2) {
      return res.status(400).json({ error: 'You can only vote for up to 2 movies per week' });
    }

    // Cast the vote
    const vote = await prisma.vote.create({
      data: {
        userId,
        nominationId,
      },
    });

    res.status(201).json(vote);
  } catch (error) {
    console.error('Error casting vote:', error);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

export default router;
