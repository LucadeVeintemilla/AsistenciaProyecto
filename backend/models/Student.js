const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grade: { type: String },
});

module.exports = mongoose.model('Student', studentSchema);
