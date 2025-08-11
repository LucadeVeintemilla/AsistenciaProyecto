const Attendance = require('../models/Attendance');
const Class = require('../models/Class');

function getDateRange(period) {
  const now = new Date();
  if (period === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return { $gte: start };
  }
  if (period === 'month') {
    const start = new Date(now);
    start.setMonth(now.getMonth() - 1);
    return { $gte: start };
  }
  return {}; // all
}

// /reports/teacher?teacher=<id>&student=<id>&classId=<id>&period=week|month|all
exports.teacherReport = async (req, res) => {
  try {
    const { teacher, student, classId, period = 'all' } = req.query;
    if (!teacher) return res.status(400).json({ message: 'teacher is required' });

    const match = { 'cls.teacher': teacher };
    if (classId) match['cls._id'] = classId;

    const dateRange = getDateRange(period);
    if (Object.keys(dateRange).length) match.date = dateRange;

    // lookup classes first
    const classes = await Class.find({ teacher }).select('_id name');
    const classMap = Object.fromEntries(classes.map((c) => [c._id.toString(), c.name]));

    const pipeline = [
      { $match: { classId: { $in: classes.map((c) => c._id) }, ...(dateRange.$gte ? { date: dateRange } : {}) } },
      { $unwind: '$records' },
      { $match: student ? { 'records.student': student } : {} },
      {
        $group: {
          _id: { classId: '$classId', student: '$records.student', status: '$records.status' },
          count: { $sum: 1 },
        },
      },
    ];

    const agg = await Attendance.aggregate(pipeline);

    // reshape
    const result = {};
    agg.forEach(({ _id, count }) => {
      const { classId: cId, student: st, status } = _id;
      const key = `${cId}_${st}`;
      if (!result[key]) result[key] = { classId: cId.toString(), className: classMap[cId.toString()] || '', student: st.toString(), presente: 0, tardanza: 0, falta: 0 };
      result[key][status] = count;
    });

    res.json(Object.values(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// /reports/parent?student=<id>&classId=<id>&period=week|month|all
exports.parentReport = async (req, res) => {
  try {
    const { student, classId, period = 'all' } = req.query;
    if (!student) return res.status(400).json({ message: 'student is required' });

    const match = { 'records.student': student };
    if (classId) match.classId = classId;
    const dateRange = getDateRange(period);
    if (Object.keys(dateRange).length) match.date = dateRange;

    const pipeline = [
      { $match: match },
      { $unwind: '$records' },
      { $match: { 'records.student': student } },
      {
        $group: {
          _id: { classId: '$classId', status: '$records.status' },
          count: { $sum: 1 },
        },
      },
    ];

    const agg = await Attendance.aggregate(pipeline);
    // get class names
    const classIds = [...new Set(agg.map((a) => a._id.classId))];
    const classes = await Class.find({ _id: { $in: classIds } }).select('_id name');
    const classMap = Object.fromEntries(classes.map((c) => [c._id.toString(), c.name]));

    const result = {};
    agg.forEach(({ _id, count }) => {
      const { classId: cId, status } = _id;
      const key = cId.toString();
      if (!result[key]) result[key] = { classId: key, className: classMap[key] || '', presente: 0, tardanza: 0, falta: 0 };
      result[key][status] = count;
    });

    res.json(Object.values(result));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
