const pool = require('../db/pool');

exports.getDashboard = async (req, res) => {
  const dcId = req.query.dc_id ?? req.params.dcId ?? 1;
  try {
    const [rows] = await pool.query('CALL sp_get_dashboard_summary(?)', [dcId]);
    res.json(rows[0]?.[0] ?? rows[0] ?? {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCapacity = async (req, res) => {
  const days = parseInt(req.query.days ?? '7', 10);
  try {
    const [rows] = await pool.query('CALL sp_node_capacity_report(?, ?)', [req.params.nodeId, days]);
    res.json(rows[0] ?? rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAudit = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM v_audit_recent');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
