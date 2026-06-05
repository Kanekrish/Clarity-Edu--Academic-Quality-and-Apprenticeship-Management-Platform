const db = require('./database');

/**
 * Write an audit log entry.
 * @param {object} actor  - { id, name } of the user performing the action
 * @param {string} action - Human-readable description of the action
 * @param {string} type   - 'info' | 'warning' | 'success'
 * @param {string} [detail] - Optional extra detail
 */
function logAudit(actor, action, type = 'info', detail = null) {
  try {
    db.prepare(
      'INSERT INTO audit_logs (actor_id, actor_name, action, type, detail) VALUES (?, ?, ?, ?, ?)'
    ).run(actor?.id ?? null, actor?.name ?? 'System', action, type, detail);
  } catch {
    // Audit failures must never crash the main operation
  }
}

module.exports = logAudit;
