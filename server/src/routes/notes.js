// server/src/routes/notes.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticate = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/notes -- Get current user's notes
router.get('/', authenticate, async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      where: { userId: req.user.userId },
      orderBy: [
        { isPinned: 'desc' },   // Pinned notes first
        { updatedAt: 'desc' },  // Then by most recently updated
      ],
    });

    res.json({ notes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// POST /api/notes -- Create a note
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        category: category || 'General',
        userId: req.user.userId,  // Automatically set to the logged-in user
      },
    });

    res.status(201).json({ note });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// GET /api/notes/:id -- Get a specific note
router.get('/:id', authenticate, async (req, res) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Resource-level authorization: only the owner can view their note
    if (note.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You do not have permission to view this note' });
    }

    res.json({ note });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// PUT /api/notes/:id -- Update a note
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, content, category, isPinned } = req.body;

    // First, find the note
    const existingNote = await prisma.note.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Resource-level authorization: only the owner can update
    if (existingNote.userId !== req.user.userId) {
      return res.status(403).json({
        error: 'You can only edit your own notes',
      });
    }

    const updatedNote = await prisma.note.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title: title ?? existingNote.title,
        content: content ?? existingNote.content,
        category: category ?? existingNote.category,
        isPinned: isPinned ?? existingNote.isPinned,
      },
    });

    res.json({ note: updatedNote });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /api/notes/:id -- Delete a note
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Resource-level authorization: owner OR admin can delete
    if (note.userId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'You can only delete your own notes',
      });
    }

    await prisma.note.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;