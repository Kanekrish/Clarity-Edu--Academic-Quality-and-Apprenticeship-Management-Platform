const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/logs — audit log entries (most recent first)
router.get('/', auth, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const rows = db.prepare(`
      SELECT id, actor_name, action, type, detail, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
