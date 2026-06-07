const pool = require('../db/pool');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM racks ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM racks WHERE rack_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { dc_id, rack_label, zone, max_units, max_power_kw } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO racks (dc_id, rack_label, zone, max_units, max_power_kw) VALUES (?,?,?,?,?)',
      [dc_id, rack_label, zone, max_units ?? 42, max_power_kw]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
