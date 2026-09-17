import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, securityQuestion, securityAnswer } = req.body;

    if (!username || !password || !securityQuestion || !securityAnswer) {
      return res.status(400).json({ error: 'Username, password, security question, and answer are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const securityAnswerHash = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        securityQuestion,
        securityAnswerHash
      },
    });

    const token = jwt.sign({ userId: user.id, username: user.username, isAdmin: user.isAdmin }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ token, user: { id: user.id, username: user.username, isAdmin: user.isAdmin } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username, isAdmin: user.isAdmin }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, user: { id: user.id, username: user.username, isAdmin: user.isAdmin } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { username, currentPassword, newPassword, securityQuestion, securityAnswer } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare update data
    const updateData: any = {};

    // Validate and update username
    if (username && username !== user.username) {
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      updateData.username = username;
    }

    // Validate and update password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password' });
      }
      
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Incorrect current password' });
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    // Validate and update security question/answer
    if (securityQuestion && securityAnswer) {
      updateData.securityQuestion = securityQuestion;
      updateData.securityAnswerHash = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Generate a new token in case the username changed
    const token = jwt.sign({ userId: updatedUser.id, username: updatedUser.username, isAdmin: updatedUser.isAdmin }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, user: { id: updatedUser.id, username: updatedUser.username, isAdmin: updatedUser.isAdmin }, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get security question for a user
router.get('/security-question/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({ where: { username } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.securityQuestion) {
      return res.status(400).json({ error: 'User has not set up a security question. Please ask an admin to reset your password.' });
    }

    res.json({ question: user.securityQuestion });
  } catch (error) {
    console.error('Error fetching security question:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password using security answer
router.post('/reset-password', async (req, res) => {
  try {
    const { username, securityAnswer, newPassword } = req.body;

    if (!username || !securityAnswer || !newPassword) {
      return res.status(400).json({ error: 'Username, answer, and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    
    if (!user || !user.securityAnswerHash) {
      return res.status(400).json({ error: 'User or security data not found' });
    }

    const isAnswerValid = await bcrypt.compare(securityAnswer.toLowerCase().trim(), user.securityAnswerHash);

    if (!isAnswerValid) {
      return res.status(401).json({ error: 'Incorrect security answer' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({ success: true, message: 'Password has been successfully reset. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
