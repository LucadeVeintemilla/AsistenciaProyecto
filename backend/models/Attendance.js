const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  records: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      status: {
        type: String,
        enum: ['presente', 'tardanza', 'falta'],
        required: true,
      },
      comment: String,
    },
  ],
});

module.exports = mongoose.model('Attendance', attendanceSchema);
