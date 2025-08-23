const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');
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
    // ensure we are comparing ObjectIds inside the aggregation pipeline
    const studentObj = student ? new mongoose.Types.ObjectId(student) : null;
    const classObj = classId ? new mongoose.Types.ObjectId(classId) : null;
    if (!teacher) return res.status(400).json({ message: 'teacher is required' });

    // Build list of classes for the teacher first so we can restrict the aggregation
    const classFilter = { teacher };
    if (classObj) classFilter._id = classObj;

    const dateRange = getDateRange(period);
    

    // lookup classes first with optional class filter
    const classes = await Class.find(classFilter).select('_id name');
    const classMap = Object.fromEntries(classes.map((c) => [c._id.toString(), c.name]));

    const pipeline = [
      {
        $match: {
          classId: { $in: classes.map((c) => c._id) },
          ...(Object.keys(dateRange).length ? { date: dateRange } : {}),
        },
      },
      { $unwind: '$records' },
    ];
    if (studentObj) {
      pipeline.push({ $match: { 'records.student': studentObj } });
    }
    pipeline.push({
      $group: {
        _id: { classId: '$classId', student: '$records.student', status: '$records.status' },
        count: { $sum: 1 },
      },
    });

    const agg = await Attendance.aggregate(pipeline);

    // reshape
    // Agrupar por nombre de curso (puede repetirse con distintos horarios)
    const merged = {};
    agg.forEach(({ _id, count }) => {
      const { classId: cId, student: st, status } = _id;
      const name = classMap[cId.toString()] || 'Sin nombre';
      const key = `${name}_${st}`; // mantener separado por alumno si aplica
      if (!merged[key]) merged[key] = { className: name, student: st.toString(), presente: 0, tardanza: 0, falta: 0 };
      merged[key][status] += count;
    });

    res.json(Object.values(merged));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// /reports/parent?student=<id>&classId=<id>&period=week|month|all
exports.parentReport = async (req, res) => {
  try {
    const { student, classId, period = 'all' } = req.query;
    const studentObj = new mongoose.Types.ObjectId(student);
    const classObj = classId ? new mongoose.Types.ObjectId(classId) : null;
    if (!student) return res.status(400).json({ message: 'student is required' });

    const match = { 'records.student': studentObj };
    if (classObj) match.classId = classObj;
    const dateRange = getDateRange(period);
    if (Object.keys(dateRange).length) match.date = dateRange;
    

    const pipeline = [
      { $match: match },
      { $unwind: '$records' },
      { $match: { 'records.student': studentObj } },
      {
        $group: {
          _id: { classId: '$classId', status: '$records.status' },
          count: { $sum: 1 },
        },
      },
    ];

    const agg = await Attendance.aggregate(pipeline);
    // get class names
    const classIds = [...new Set(agg.map((a) => a._id.classId))].filter(Boolean);
    const classes = await Class.find({ _id: { $in: classIds } }).select('_id name');
    const classMap = Object.fromEntries(classes.map((c) => [c._id.toString(), c.name]));

    // Agrupar por nombre de curso (puede haber varios documentos para mismo curso en horarios distintos)
    const merged = {};
    agg.forEach(({ _id, count }) => {
      const { classId: cId, status } = _id;
      const name = classMap[cId.toString()] || 'Sin nombre';
      if (!merged[name]) merged[name] = { className: name, presente: 0, tardanza: 0, falta: 0 };
      merged[name][status] += count;
    });

    res.json(Object.values(merged));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
