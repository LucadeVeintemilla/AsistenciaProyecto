const express = require('express');
const {
  recordAttendance,
  getAttendanceByClass,
} = require('../controllers/attendanceController');
const { getByStudent } = require('../controllers/attendanceStudentController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, authorize('docente'), recordAttendance);
// attendance by student (más específico primero)
router.get('/student/:studentId', protect, authorize('padre', 'psicologo'), getByStudent);
router.get('/:classId', protect, authorize('docente', 'padre', 'coordinador', 'psicologo'), getAttendanceByClass);

module.exports = router;
