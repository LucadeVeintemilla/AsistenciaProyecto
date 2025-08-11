const mongoose = require('mongoose');
const Class = require('../models/Class');

exports.createClass = async (req, res) => {
  try {
        const { name, teacher, students, start, end } = req.body;
    const newClass = await Class.create({ name, teacher, students, start, end });
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getClassById = async (req, res) => {
  console.log('Looking for class ID:', req.params.id);
  try {
    const cls = await Class.findById(req.params.id).lean();
    console.log('Raw class from DB:', cls);
    
    // Manually populate students (Student collection) if needed
    if (cls.students && cls.students.length > 0) {
      const students = await mongoose.model('Student').find({ 
        _id: { $in: cls.students } 
      }).select('name');
      console.log('Fetched students:', students);
      cls.students = students;
    }
    
    // Populate teacher
    if (cls.teacher) {
      const teacher = await mongoose.model('User').findById(cls.teacher).select('name');
      console.log('Fetched teacher:', teacher);
      cls.teacher = teacher;
    }
    res.json(cls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getClasses = async (req, res) => {
  try {
        const query = req.query.teacher ? { teacher: req.query.teacher } : {};
    const classes = await Class.find(query).populate('teacher', 'name').populate('students', 'name');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update class (name, teacher, students, and optionally start/end)
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, teacher, students, start, end } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (teacher !== undefined) update.teacher = teacher;
    if (students !== undefined) update.students = students;
    if (start !== undefined) update.start = start;
    if (end !== undefined) update.end = end;

    const updated = await Class.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return res.status(404).json({ message: 'Clase no encontrada' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

