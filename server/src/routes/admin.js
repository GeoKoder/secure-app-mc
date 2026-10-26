// server/src/routes/admin.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/auth');
const { requireRole, requireMinRole } = require('../middleware/authorize');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/admin/users -- List all users (admin only)
router.get('/users', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users, total: users.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /api/admin/users/:id/role -- Change a user's role (admin only)
router.patch('/users/:id/role', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['USER', 'EDITOR', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        validRoles,
      });
    }

    // Prevent admin from changing their own role
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({
        error: 'You cannot change your own role',
      });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    res.json({ message: `Role updated to ${role}`, user });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// DELETE /api/admin/users/:id -- Delete a user (admin only)
router.delete('/users/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({
        error: 'You cannot delete your own account from the admin panel',
      });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/admin/stats -- Dashboard stats (editor and admin)
router.get('/stats', authenticate, requireMinRole('EDITOR'), async (req, res) => {
  try {
    const [userCount, noteCount] = await Promise.all([
      prisma.user.count(),
      prisma.note.count(),
    ]);

    res.json({
      users: userCount,
      notes: noteCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;