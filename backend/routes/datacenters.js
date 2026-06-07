const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/datacenterController');

router.use(verifyToken);
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/',   requireRole(['ADMIN','ENGINEER']), ctrl.create);

module.exports = router;
