const pool = require('../db/pool');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM datacenters ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM datacenters WHERE dc_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { dc_name, location, total_power_kw, cooling_type } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO datacenters (dc_name, location, total_power_kw, cooling_type) VALUES (?,?,?,?)',
      [dc_name, location, total_power_kw, cooling_type]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
