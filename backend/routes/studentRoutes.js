const express = require('express');
const {
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(protect, authorize('coordinador', 'psicologo', 'padre'), getStudents)
  .post(protect, authorize('coordinador'), createStudent);

router
  .route('/:id')
  .put(protect, authorize('coordinador'), updateStudent)
  .delete(protect, authorize('coordinador'), deleteStudent);

module.exports = router;
