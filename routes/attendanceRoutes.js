const express = require('express');
const router = express.Router();
const {
  getAttendanceByDate,
  upsertAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

router.get('/:date', protect, getAttendanceByDate);
router.post('/bulk', protect, upsertAttendance);

module.exports = router;
