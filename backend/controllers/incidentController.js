const pool = require('../db/pool');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM v_open_incidents ORDER BY raised_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM incidents WHERE incident_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { title, description, severity, node_id, rack_id } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO incidents (title, description, severity, node_id, rack_id, raised_by) VALUES (?,?,?,?,?,?)',
      [title, description ?? null, severity ?? 'P3', node_id ?? null, rack_id ?? null, req.user.user_id]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { status, severity, assigned_to } = req.body;
  try {
    await pool.query(
      'UPDATE incidents SET status = COALESCE(?, status), severity = COALESCE(?, severity), assigned_to = COALESCE(?, assigned_to), resolved_at = CASE WHEN ? = \'closed\' THEN NOW() ELSE resolved_at END WHERE incident_id = ?',
      [status ?? null, severity ?? null, assigned_to ?? null, status ?? null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM incidents WHERE incident_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.assign = async (req, res) => {
  const { user_id } = req.body;
  try {
    await pool.query('CALL sp_assign_incident(?, ?)', [req.params.id, user_id]);
    res.json({ assigned: true, incident_id: parseInt(req.params.id, 10), user_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
