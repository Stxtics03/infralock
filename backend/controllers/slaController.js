const pool = require('../db/pool');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM v_sla_health ORDER BY client_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM slas WHERE sla_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const {
    node_id, rack_id, client_name, uptime_target_pct, response_time_ms,
    penalty_amount, start_date, end_date,
  } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO slas (node_id, rack_id, client_name, uptime_target_pct, response_time_ms, penalty_amount, start_date, end_date)
       VALUES (?,?,?,?,?,?,?,?)`,
      [node_id ?? null, rack_id ?? null, client_name, uptime_target_pct, response_time_ms, penalty_amount ?? 0, start_date, end_date]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkCompliance = async (req, res) => {
  try {
    await pool.query('CALL sp_check_sla_compliance(?)', [req.params.id]);
    res.json({ checked: true, sla_id: parseInt(req.params.id, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
