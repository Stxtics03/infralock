const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/incidentController');

router.use(verifyToken);
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/',   requireRole(['ADMIN','ENGINEER']), ctrl.create);
router.patch('/:id', requireRole(['ADMIN','ENGINEER']), ctrl.update);
router.post('/:id/assign', requireRole(['ADMIN','ENGINEER']), ctrl.assign);

module.exports = router;
