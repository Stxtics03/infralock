const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  const conn = await pool.getConnection();
  try {
    const [[user]] = await conn.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );
    if (!user)
      return res.status(401).json({ error: 'Invalid credentials.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials.' });

    const [[mfaCfg]] = await conn.query(
      'SELECT enabled FROM mfa_config WHERE user_id = ?', [user.user_id]
    );
    const mfaEnabled = mfaCfg?.enabled === 1;

    const token = jwt.sign(
      {
        user_id: user.user_id,
        email:   user.email,
        role:    user.role,
        mfa_required: mfaEnabled,
        mfa_verified: false,
      },
      process.env.JWT_SECRET,
      { expiresIn: mfaEnabled ? '1h' : '8h' }
    );

    await conn.query(
      'UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]
    );

    return res.json({
      token,
      mfa_required: mfaEnabled,
      user: {
        user_id:   user.user_id,
        email:     user.email,
        role:      user.role,
        full_name: user.full_name,
      }
    });
  } finally {
    conn.release();
  }
}

async function me(req, res) {
  return res.json({ user: req.user });
}

async function changePassword(req, res) {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password)
    return res.status(400).json({ error: 'current_password and new_password are required.' });

  if (new_password.length < 8)
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });

  if (current_password === new_password)
    return res.status(400).json({ error: 'New password must differ from current password.' });

  const conn = await pool.getConnection();
  try {
    const [[user]] = await conn.query(
      'SELECT * FROM users WHERE user_id = ?', [req.user.user_id]
    );
    if (!user)
      return res.status(404).json({ error: 'User not found.' });

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Current password is incorrect.' });

    const hash = await bcrypt.hash(new_password, 12);
    await conn.query(
      'UPDATE users SET password_hash = ? WHERE user_id = ?', [hash, user.user_id]
    );

    return res.json({ message: 'Password updated successfully.' });
  } finally {
    conn.release();
  }
}

module.exports = { login, me, changePassword };