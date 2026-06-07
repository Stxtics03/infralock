const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/anomalyController');

router.use(verifyToken);

router.get('/',                requireRole(['ADMIN','ENGINEER','AUDITOR']), ctrl.getAll);
router.get('/summary',         requireRole(['ADMIN','ENGINEER','AUDITOR']), ctrl.getSummary);
router.get('/:nodeId',         requireRole(['ADMIN','ENGINEER','AUDITOR']), ctrl.getByNode);
router.patch('/:id/resolve',   requireRole(['ADMIN','ENGINEER']),           ctrl.resolve);
router.post('/run',            requireRole(['ADMIN']),                      ctrl.triggerRun);

module.exports = router;