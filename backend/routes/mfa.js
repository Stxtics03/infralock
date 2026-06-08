/**
 * backend/routes/mfa.js
 *
 * Register in server.js:
 *   app.use('/api/mfa', require('./routes/mfa'));
 *
 * All routes require verifyToken. ADMIN-only where noted.
 */

const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/mfaController');
const pool = require('../db/pool');
const { generateMfaSessionToken } = require('../middleware/requireMFA');

router.use(verifyToken);

// Setup flow
router.post('/setup',        ctrl.setup);
router.post('/verify-setup', ctrl.verifySetup);

// Runtime second-factor verification (called from VerifyMfa.jsx after password login)
router.post('/verify', ctrl.verify);

// Session token: after /verify succeeds, frontend calls this to get the x-mfa-verified HMAC
router.get('/session-token', (req, res) => {
  res.json({ mfaToken: generateMfaSessionToken(req.user.id) });
});

// Management
router.get('/status',                       ctrl.status);
router.delete('/disable',                   ctrl.disable);
router.post('/backup-codes/regenerate',     ctrl.regenerateBackupCodes);

// Admin only: view all users' MFA state
router.get('/admin/overview', requireRole(['ADMIN']), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM v_mfa_status ORDER BY user_id');
    res.json(rows);
  } finally {
    conn.release();
  }
});

module.exports = router;
