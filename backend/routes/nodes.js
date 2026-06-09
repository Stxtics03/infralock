const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/nodeController');

router.use(verifyToken);

// ── Existing routes ───────────────────────────────────────────────────────────
router.get('/',      ctrl.getAll);
router.get('/:id',   ctrl.getOne);
router.post('/',     requireRole(['ADMIN','ENGINEER']), ctrl.create);
router.patch('/:id', requireRole(['ADMIN','ENGINEER']), ctrl.update);
router.post('/:id/decommission', requireRole(['ADMIN','ENGINEER']), ctrl.decommission);

// ── Node Detail additions (Phase 4) ──────────────────────────────────────────
const db = require('../db');

function tryParseJSON(val) {
  if (!val || typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return val; }
}

// GET /api/nodes/:id/incidents
router.get('/:id/incidents', async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      `SELECT
         i.id, i.title, i.description, i.severity, i.status,
         i.started_at, i.resolved_at, i.created_at,
         u.email AS assigned_to_email
       FROM incidents i
       LEFT JOIN users u ON u.id = i.assigned_to
       WHERE i.node_id = ?
       ORDER BY i.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.params.id, limit, offset]
    );
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM incidents WHERE node_id = ?',
      [req.params.id]
    );
    return res.json({ data: rows, total, page, limit });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/nodes/:id/sla
router.get('/:id/sla', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         sp.id, sp.name, sp.type, sp.target_percentage, sp.period,
         ns.current_percentage, ns.last_evaluated_at, ns.is_breached
       FROM sla_policies sp
       LEFT JOIN node_sla ns
         ON ns.sla_policy_id = sp.id AND ns.node_id = ?
       WHERE ns.node_id = ? OR sp.applies_to_all = 1
       ORDER BY sp.name`,
      [req.params.id, req.params.id]
    );
    return res.json({ data: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/nodes/:id/config-snapshots
router.get('/:id/config-snapshots', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, node_id, version, config, snapshot_data,
              commit_hash, changed_by, notes, created_at
       FROM config_snapshots
       WHERE node_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.params.id]
    );
    const snapshots = rows.map(row => ({
      ...row,
      config: tryParseJSON(row.config || row.snapshot_data),
    }));
    return res.json({ data: snapshots });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/nodes/:id/status
router.patch('/:id/status', requireRole(['ADMIN', 'ENGINEER']), async (req, res) => {
  const allowed = ['online', 'offline', 'maintenance', 'degraded'];
  const { status } = req.body;
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }
  try {
    await db.query(
      'UPDATE nodes SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, req.params.id]
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
