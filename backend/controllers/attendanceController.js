const Attendance = require('../models/Attendance');
const Class = require('../models/Class');

exports.recordAttendance = async (req, res) => {
  const { classId, date, records } = req.body;
  try {
    let attendance = await Attendance.findOne({ classId, date });
    if (attendance) {
      attendance.records = records;
    } else {
      attendance = new Attendance({ classId, date, records });
    }
    await attendance.save();

    // Calculate attendance percentage for each student
    const io = req.app.get('io');
    for (const rec of records) {
      const total = await Attendance.countDocuments({
        'records.student': rec.student,
      });
      const present = await Attendance.countDocuments({
        'records': {
          $elemMatch: { student: rec.student, status: 'presente' },
        },
      });
      const percent = total ? (present / total) * 100 : 100;

      if (percent < 70) {
        // alert psicologo
        io.emit('alert', {
          type: 'alert',
          student: rec.student,
          percent,
        });
      } else if (percent < 87) {
        io.emit('prealert', {
          type: 'prealert',
          student: rec.student,
          percent,
        });
      }
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAttendanceByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const attendance = await Attendance.find({ classId }).populate('records.student', 'name');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
