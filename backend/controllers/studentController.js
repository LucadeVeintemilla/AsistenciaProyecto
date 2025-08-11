const Student = require('../models/Student');
const User = require('../models/User');

exports.createStudent = async (req, res) => {
  try {
        const { name, parentEmail, grade } = req.body;
    // find parent by email
    const parent = await User.findOne({ email: parentEmail, role: 'padre' });
    if (!parent) return res.status(400).json({ message: 'Padre no encontrado' });
    const student = await Student.create({ name, parent: parent._id, grade });
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
          const filter = req.query.parent ? { parent: req.query.parent } : {};
    if (req.user.role === 'padre') {
      filter.parent = req.user._id;
    }
    const students = await Student.find(filter).populate('parent', 'name email');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndUpdate(id, req.body, { new: true });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    await Student.findByIdAndDelete(id);
    res.json({ message: 'Student removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
