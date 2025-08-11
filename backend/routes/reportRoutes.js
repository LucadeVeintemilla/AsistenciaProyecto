const express = require('express');
const router = express.Router();
const { teacherReport, parentReport } = require('../controllers/reportController');

router.get('/teacher', teacherReport);
router.get('/parent', parentReport);

module.exports = router;
