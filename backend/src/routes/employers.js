const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/employers
router.get('/', auth, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM employers ORDER BY name').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employers
router.post('/', auth, (req, res) => {
  const { name, contact_name, contact_email } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const result = db.prepare(
      'INSERT INTO employers (name, contact_name, contact_email) VALUES (?, ?, ?)'
    ).run(name, contact_name || null, contact_email || null);
    res.status(201).json({ message: 'Employer created', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
