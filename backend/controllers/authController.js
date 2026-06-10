const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../db/pool');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

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
        user_id:      user.user_id,
        email:        user.email,
        role:         user.role,
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

async function inviteUser(req, res) {
  // Only ADMINs can invite
  if (req.user.role !== 'ADMIN')
    return res.status(403).json({ error: 'Only admins can invite users.' });

  const { full_name, email, role } = req.body;

  if (!full_name || !email)
    return res.status(400).json({ error: 'full_name and email are required.' });

  const allowedRoles = ['ADMIN', 'ENGINEER', 'VIEWER'];
  const assignedRole = allowedRoles.includes(role) ? role : 'ENGINEER';

  // Temp password handed to admin to share with new user
  const tempPassword = `Infralock@${Math.floor(100000 + Math.random() * 900000)}`;

  const conn = await pool.getConnection();
  try {
    // Check duplicate in local DB
    const [[existing]] = await conn.query(
      'SELECT user_id FROM users WHERE email = ?', [email]
    );
    if (existing)
      return res.status(409).json({ error: 'A user with this email already exists.' });

    // Create in Supabase
    const { data: sbData, error: sbError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password:      tempPassword,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (sbError)
      return res.status(500).json({ error: `Supabase error: ${sbError.message}` });

    const supabase_uid = sbData.user.id;

    // Hash temp password for local DB
    const hash = await bcrypt.hash(tempPassword, 12);

    // Insert into local users table
    const [result] = await conn.query(
      `INSERT INTO users (supabase_uid, full_name, email, role, status, password_hash)
       VALUES (?, ?, ?, ?, 'active', ?)`,
      [supabase_uid, full_name, email, assignedRole, hash]
    );

    const newUserId = result.insertId;

    // Audit trail
    await conn.query(
      `INSERT INTO audit_trail (table_name, operation, record_pk, performed_by, performed_at, new_values, ip_address)
       VALUES ('users', 'INSERT', ?, ?, NOW(), ?, ?)`,
      [
        String(newUserId),
        req.user.email,
        JSON.stringify({ full_name, email, role: assignedRole }),
        req.ip || '0.0.0.0',
      ]
    );

    return res.status(201).json({
      message:       'User created successfully.',
      temp_password: tempPassword,
      user: {
        user_id:   newUserId,
        full_name,
        email,
        role:      assignedRole,
      }
    });
  } finally {
    conn.release();
  }
}

module.exports = { login, me, changePassword, inviteUser };