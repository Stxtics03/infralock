const express = require('express');
const router  = express.Router();
const { login, me, changePassword, inviteUser } = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/login',           login);
router.get('/me',               verifyToken, me);
router.put('/change-password',  verifyToken, changePassword);
router.post('/invite',          verifyToken, requireRole(['ADMIN']), inviteUser);

module.exports = router;