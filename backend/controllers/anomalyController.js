const pool = require('../db/pool');
const { runDetection } = require('../jobs/anomalyDetector');

exports.getAll = async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const offset = page * 50;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ai_anomalies WHERE resolved_at IS NULL ORDER BY detected_at DESC LIMIT 50 OFFSET ?',
      [offset]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM v_node_anomaly_summary ORDER BY critical_count DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getByNode = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ai_anomalies WHERE node_id = ? ORDER BY detected_at DESC',
      [req.params.nodeId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resolve = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      'UPDATE ai_anomalies SET resolved_at = NOW() WHERE anomaly_id = ?',
      [req.params.id]
    );
    await conn.query(
      `INSERT INTO audit_trail (table_name, operation, record_pk, performed_by, performed_at, new_values, ip_address)
       VALUES ('ai_anomalies', 'UPDATE', ?, ?, NOW(), JSON_OBJECT('resolved_at', NOW()), ?)`,
      [req.params.id, req.user.id, req.ip]
    );
    res.json({ resolved: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.triggerRun = async (req, res) => {
  try {
    await runDetection();
    res.json({ triggered: true, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};