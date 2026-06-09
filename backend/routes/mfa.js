const express = require('express');
const router = express.Router();
const { verifyToken, verifyTokenLight, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/mfaController');
const pool = require('../db/pool');

// /verify uses light auth - token may not have mfa_verified yet
router.post('/verify', verifyTokenLight, ctrl.verify);

// All other routes require full auth
router.use(verifyToken);
router.post('/setup', ctrl.setup);
router.post('/verify-setup', ctrl.verifySetup);
router.get('/status', ctrl.status);
router.delete('/disable', ctrl.disable);
router.post('/backup-codes/regenerate', ctrl.regenerateBackupCodes);
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
