const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/slaController');

router.use(verifyToken);
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/',   requireRole(['ADMIN','ENGINEER']), ctrl.create);
router.post('/:id/check-compliance', requireRole(['ADMIN','ENGINEER']), ctrl.checkCompliance);

module.exports = router;
