const express = require('express');
const {
  getNotifications,
  createNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, getNotifications);
router.post('/', protect, createNotification);

module.exports = router;
