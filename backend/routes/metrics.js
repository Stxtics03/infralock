const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const pool = require('../db/pool');

router.use(verifyToken);

router.post('/', requireRole(['ADMIN','ENGINEER']), async (req, res) => {
  const { node_id, cpu_pct, memory_pct, disk_pct } = req.body;
  if (!node_id || cpu_pct == null || memory_pct == null || disk_pct == null) {
    return res.status(400).json({ error: 'node_id, cpu_pct, memory_pct, disk_pct are required' });
  }
  try {
    await pool.query(
      'INSERT INTO capacity_metrics (node_id, cpu_pct, memory_pct, disk_pct) VALUES (?, ?, ?, ?)',
      [node_id, cpu_pct, memory_pct, disk_pct]
    );
    return res.json({ message: 'Metric recorded' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to record metric' });
  }
});

router.get('/:nodeId', requireRole(['ADMIN','ENGINEER','AUDITOR']), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM capacity_metrics WHERE node_id = ? ORDER BY recorded_at DESC LIMIT 20',
      [req.params.nodeId]
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

module.exports = router;
