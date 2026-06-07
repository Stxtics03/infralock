const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/nodeController');

router.use(verifyToken);
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/',   requireRole(['ADMIN','ENGINEER']), ctrl.create);
router.patch('/:id', requireRole(['ADMIN','ENGINEER']), ctrl.update);
router.post('/:id/decommission', requireRole(['ADMIN','ENGINEER']), ctrl.decommission);

module.exports = router;
