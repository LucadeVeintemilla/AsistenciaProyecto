const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  start: { type: Date, required: true },
  end: { type: Date, required: true },
});

module.exports = mongoose.model('Class', classSchema);
