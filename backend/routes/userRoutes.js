const express = require('express');
const { getUsers } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, authorize('coordinador'), getUsers);

module.exports = router;
