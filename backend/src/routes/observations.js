const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/observations — all observations for the logged-in user
// Ofsted inspectors see all observations; other roles only see their own
router.get('/', auth, (req, res) => {
  try {
    const rows = req.user.role === 'ofsted_inspector'
      ? db.prepare('SELECT * FROM observations ORDER BY recorded_at DESC').all()
      : db.prepare('SELECT * FROM observations WHERE coach_id = ? ORDER BY recorded_at DESC').all(req.user.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/observations — add an observation note
router.post('/', auth, (req, res) => {
  const { category, content } = req.body;
  if (!category || !content) {
    return res.status(400).json({ error: 'category and content are required' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO observations (coach_id, category, content)
      VALUES (?, ?, ?)
    `).run(req.user.id, category, content);
    res.status(201).json({ message: 'Observation saved', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/observations/:id
// Ofsted inspectors can delete any observation; others only their own
router.delete('/:id', auth, (req, res) => {
  try {
    if (req.user.role === 'ofsted_inspector') {
      db.prepare('DELETE FROM observations WHERE id = ?').run(req.params.id);
    } else {
      db.prepare('DELETE FROM observations WHERE id = ? AND coach_id = ?').run(req.params.id, req.user.id);
    }
    res.json({ message: 'Observation deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
