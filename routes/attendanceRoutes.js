const express = require('express');
const router = express.Router();
const {
  getAttendanceByDate,
  getAttendanceByYear,
  upsertAttendance,
} = require('../controllers/attendanceController');
const { verifyToken, checkAccess } = require('../middleware/authMiddleware');

router.get('/:date', verifyToken, checkAccess('attendance'), getAttendanceByDate);
router.get('/year/report/:year', verifyToken, checkAccess('attendance'), getAttendanceByYear);
router.post('/bulk', verifyToken, checkAccess('attendance'), upsertAttendance);

module.exports = router;
