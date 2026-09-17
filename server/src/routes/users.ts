import express from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user!.isAdmin) {
      return res.status(403).json({ error: 'Only admins can view users' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: {
        id: 'asc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user admin status (Admin only)
router.put('/:id/role', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user!.isAdmin) {
      return res.status(403).json({ error: 'Only admins can change roles' });
    }

    const targetUserId = parseInt(req.params.id);
    const { isAdmin } = req.body;

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Prevent removing your own admin status
    if (targetUserId === req.user!.userId && !isAdmin) {
      return res.status(400).json({ error: 'You cannot revoke your own admin rights' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { isAdmin },
      select: {
        id: true,
        username: true,
        isAdmin: true,
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

export default router;
