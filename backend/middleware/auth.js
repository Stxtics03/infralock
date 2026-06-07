const { createClient } = require('@supabase/supabase-js');
const pool = require('../db/pool');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  const [rows] = await pool.query('SELECT * FROM users WHERE supabase_uid = ?', [user.id]);
  if (!rows.length) return res.status(403).json({ error: 'User not found' });
  req.user = rows[0];
  next();
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
