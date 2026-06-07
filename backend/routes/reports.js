const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/auth');
const ctrl = require('../controllers/reportController');

router.use(verifyToken);
router.get('/dashboard', ctrl.getDashboard);
router.get('/capacity/:nodeId', ctrl.getCapacity);
router.get('/audit', ctrl.getAudit);

module.exports = router;
