const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    await Notification.deleteMany({
      toUser: req.user._id,
      createdAt: { $lt: sevenDaysAgo },
    });

    const notifications = await Notification.find({
      toUser: req.user._id,
      createdAt: { $gte: sevenDaysAgo },
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    // emitir a tiempo real
    const io = req.app.get('io');
    io.emit('notification', notification);
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
