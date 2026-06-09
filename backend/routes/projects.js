const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const {
  getAll,
  getById,
  create,
  update,
  remove,
  assignNode,
  unassignNode,
} = require('../controllers/projectController');

// All project routes require a valid JWT
router.use(auth.verifyToken);

router.get   ('/',                    getAll);
router.get   ('/:id',                 getById);
router.post  ('/',                    create);
router.put   ('/:id',                 update);
router.delete('/:id',                 remove);
router.post  ('/:id/assign-node',     assignNode);
router.post  ('/:id/unassign-node',   unassignNode);

module.exports = router;