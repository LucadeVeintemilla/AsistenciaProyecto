const express = require('express');
const {
  createClass,
  getClasses,
  getClassById,
  updateClass,
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, authorize('coordinador'), createClass);
router.get('/', protect, authorize('coordinador', 'docente', 'psicologo', 'padre'), getClasses);
router.get('/:id', protect, authorize('coordinador', 'docente'), getClassById);
router.put('/:id', protect, authorize('coordinador'), updateClass);

router.get('/teacher/:teacherId', protect, authorize('docente'), (req, res, next) => {
  req.query.teacher = req.params.teacherId;
  next();
}, getClasses);

module.exports = router;
