/**
 * backend/middleware/requireMFA.js
 *
 * Drop-in middleware. Enforces MFA on routes that need it.
 *
 * USAGE — add after verifyToken in server.js for sensitive routes:
 *   const requireMFA = require('./middleware/requireMFA');
 *   app.use('/api/vault', verifyToken, requireMFA, require('./routes/vault'));
 *
 * HOW IT WORKS:
 *   1. If the user has MFA disabled → passes through (MFA is opt-in).
 *   2. If MFA is enabled → checks the `x-mfa-verified` request header.
 *   3. The header value is a short-lived HMAC token the frontend holds in
 *      Zustand after a successful /api/mfa/verify. It is re-issued each
 *      minute so it auto-expires. No DB hit on every request.
 *
 * TOKEN FORMAT:
 *   HMAC-SHA256( JWT_SECRET, "mfa:<userId>:<utcMinute>" )
 *   Valid for 2 minutes (current + previous) to absorb clock drift.
 */

const crypto = require('crypto');
const pool   = require('../db/pool');

const WINDOW = 2; // accept current minute and 1 prior

function hmac(userId, minuteOffset = 0) {
  const minute  = Math.floor(Date.now() / 60000) + minuteOffset;
  const message = `mfa:${userId}:${minute}`;
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(message).digest('hex');
}

function verifyMfaToken(userId, token) {
  for (let i = 0; i >= -(WINDOW - 1); i--) {
    const expected = hmac(userId, i);
    const a = Buffer.from(token,    'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  }
  return false;
}

async function requireMFA(req, res, next) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorised.' });

  const conn = await pool.getConnection();
  try {
    const [[cfg]] = await conn.query(
      'SELECT enabled FROM mfa_config WHERE user_id = ?',
      [userId]
    );

    if (!cfg?.enabled) return next(); // MFA not set up → pass through

    const token = req.headers['x-mfa-verified'];
    if (!token) {
      return res.status(403).json({ error: 'MFA verification required.', code: 'MFA_REQUIRED' });
    }
    if (!verifyMfaToken(userId, token)) {
      return res.status(403).json({ error: 'MFA token expired. Please re-verify.', code: 'MFA_TOKEN_INVALID' });
    }

    next();
  } finally {
    conn.release();
  }
}

/** Called after /api/mfa/verify — generates the token for Zustand to store. */
function generateMfaSessionToken(userId) {
  return hmac(userId, 0);
}

module.exports = requireMFA;
module.exports.generateMfaSessionToken = generateMfaSessionToken;
