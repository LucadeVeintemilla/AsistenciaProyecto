const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
