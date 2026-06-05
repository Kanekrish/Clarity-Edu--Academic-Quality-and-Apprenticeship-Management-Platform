const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/ksb-mappings — all entries with module info
router.get('/', auth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT k.*, m.code AS module_code, m.title AS module_title
      FROM ksb_mappings k
      JOIN modules m ON m.id = k.module_id
      ORDER BY m.code, k.ksb_code
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ksb-mappings/:moduleId — entries for one module
router.get('/:moduleId', auth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM ksb_mappings WHERE module_id = ? ORDER BY ksb_code
    `).all(req.params.moduleId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ksb-mappings — add a KSB entry
router.post('/', auth, (req, res) => {
  const { module_id, ksb_code, description, workplace_relevance } = req.body;
  if (!module_id || !ksb_code) {
    return res.status(400).json({ error: 'module_id and ksb_code are required' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO ksb_mappings (module_id, ksb_code, description, workplace_relevance)
      VALUES (?, ?, ?, ?)
    `).run(module_id, ksb_code, description || null, workplace_relevance || null);
    res.status(201).json({ message: 'KSB mapping added', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/ksb-mappings/:id
router.delete('/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM ksb_mappings WHERE id = ?').run(req.params.id);
    res.json({ message: 'KSB mapping deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
