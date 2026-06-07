const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/vaultController');

router.use(verifyToken);
router.post('/upload', requireRole(['ADMIN','ENGINEER']), ctrl.uploadMiddleware, ctrl.upload);
router.post('/:snapshotId/decrypt', requireRole(['ADMIN','ENGINEER']), ctrl.decrypt);
router.get('/:nodeId', ctrl.listByNode);

module.exports = router;
