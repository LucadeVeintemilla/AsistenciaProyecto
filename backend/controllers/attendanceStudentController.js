const Attendance = require('../models/Attendance');

exports.getByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const mongoose = require('mongoose');

    // Normalize the studentId to ObjectId when valid
    const studentObjectId = mongoose.Types.ObjectId.isValid(studentId)
      ? new mongoose.Types.ObjectId(studentId)
      : null;

    // Build query that matches both ObjectId and string (defensive)
    const query = studentObjectId
      ? { 'records.student': studentObjectId }
      : { 'records.student': studentId };

    const attendanceDocs = await Attendance.find(query)
      .populate('classId', 'name')
      .select('date records classId');

    const statusMap = {
      presente: 'presente',
      tardanza: 'tardanza',
      falta: 'falta',
      verde: 'presente',
      ambar: 'tardanza',
      rojo: 'falta',
    };

    const flat = attendanceDocs.map((att) => {
      const rec = att.records.find((r) => {
        if (!r || !r.student) return false;
        // If it's an ObjectId, use equals. If string, fallback to string compare
        if (typeof r.student.equals === 'function' && studentObjectId) {
          return r.student.equals(studentObjectId);
        }
        return r.student?.toString?.() === studentId;
      });

      return {
        date: att.date,
        className: att.classId?.name || 'Clase',
        status: statusMap[rec?.status] || 'falta',
        comment: rec?.comment || '',
      };
    });

    res.json(flat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
