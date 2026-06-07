const pool = require('../db/pool');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM v_active_nodes ORDER BY hostname');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM nodes WHERE node_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const {
    rack_id, hostname, ip_address, node_type, cpu_cores, ram_gb, storage_tb,
    os, rack_unit_start, rack_unit_end,
  } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO nodes (rack_id, hostname, ip_address, node_type, cpu_cores, ram_gb, storage_tb, os, rack_unit_start, rack_unit_end, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [rack_id, hostname, ip_address, node_type, cpu_cores, ram_gb, storage_tb, os ?? null, rack_unit_start, rack_unit_end, req.user.user_id]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { status, rack_id, os } = req.body;
  try {
    await pool.query(
      'UPDATE nodes SET status = COALESCE(?, status), rack_id = COALESCE(?, rack_id), os = COALESCE(?, os) WHERE node_id = ?',
      [status ?? null, rack_id ?? null, os ?? null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM nodes WHERE node_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.decommission = async (req, res) => {
  try {
    await pool.query('CALL sp_decommission_node(?, ?)', [req.params.id, req.user.user_id]);
    res.json({ decommissioned: true, node_id: parseInt(req.params.id, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
