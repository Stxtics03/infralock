const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { user, table_name, operation, date_from, date_to } = req.query;

    const conditions = [];
    const params = [];

    if (user) {
      conditions.push('performed_by LIKE ?');
      params.push(`%${user}%`);
    }
    if (table_name) {
      conditions.push('table_name = ?');
      params.push(table_name);
    }
    if (operation && ['INSERT', 'UPDATE', 'DELETE'].includes(operation.toUpperCase())) {
      conditions.push('operation = ?');
      params.push(operation.toUpperCase());
    }
    if (date_from) {
      conditions.push('performed_at >= ?');
      params.push(new Date(date_from).toISOString().slice(0, 19).replace('T', ' '));
    }
    if (date_to) {
      const to = new Date(date_to);
      to.setHours(23, 59, 59, 999);
      conditions.push('performed_at <= ?');
      params.push(to.toISOString().slice(0, 19).replace('T', ' '));
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM audit_trail ${where}`, params
    );

    const [rows] = await pool.query(
      `SELECT audit_id, table_name, operation, record_pk,
              performed_by, performed_at, old_values, new_values, ip_address
       FROM audit_trail ${where}
       ORDER BY performed_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const logs = rows.map(r => ({
      ...r,
      old_values: tryJSON(r.old_values),
      new_values: tryJSON(r.new_values),
    }));

    let meta = {};
    if (page === 1) {
      const [tables] = await pool.query(
        'SELECT DISTINCT table_name FROM audit_trail ORDER BY table_name'
      );
      meta.tables = tables.map(r => r.table_name);
    }

    res.json({ logs, total, page, limit, pages: Math.ceil(total / limit), meta });
  } catch (err) {
    console.error('[audit-log]', err);
    res.status(500).json({ error: err.message });
  }
});

function tryJSON(val) {
  if (!val || typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return val; }
}

module.exports = router;