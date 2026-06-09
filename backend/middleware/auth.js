const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

// Full auth - blocks pre-MFA tokens
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.mfa_required && !decoded.mfa_verified) {
      return res.status(401).json({ error: 'MFA verification required' });
    }
    const [[user]] = await pool.query(
      'SELECT user_id, email, role, full_name FROM users WHERE user_id = ?',
      [decoded.user_id]
    );
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = { ...user, mfa_verified: decoded.mfa_verified };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Light auth - allows pre-MFA tokens (used only for /api/mfa/verify)
async function verifyTokenLight(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [[user]] = await pool.query(
      'SELECT user_id, email, role, full_name FROM users WHERE user_id = ?',
      [decoded.user_id]
    );
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = { ...user, mfa_verified: decoded.mfa_verified };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { verifyToken, verifyTokenLight, requireRole };
