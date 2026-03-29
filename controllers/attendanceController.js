const Attendance = require('../models/Attendance');
const { createNotification } = require('../utils/notificationUtils');

// @desc    Get attendance for a date
// @route   GET /api/attendance/:date
// @access  Private
const getAttendanceByDate = async (req, res) => {
  try {
    const dateStr = req.params.date; // Expected: YYYY-MM-DD
    const records = await Attendance.find({ date: dateStr }).populate('employee', 'name department empId');
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Upsert attendance records (multiple)
// @route   POST /api/attendance/bulk
// @access  Private
const upsertAttendance = async (req, res) => {
  try {
    const { date, records } = req.body;
    
    const operations = records.map(record => ({
      updateOne: {
        filter: { date, employee: record.employee },
        update: { $set: record },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(operations);
    const updatedRecords = await Attendance.find({ date });

    // Trigger notification for Admin
    await createNotification({
      type: 'attendance',
      senderId: req.employee?._id,
      title: '[ATTENDANCE] Records Updated',
      message: `Attendance records for ${date} have been updated by ${req.employee?.name || 'System'}.`,
      link: `/attendance?date=${date}`
    });

    res.json(updatedRecords);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAttendanceByYear = async (req, res) => {
  try {
    const year = req.params.year;
    // Match date string starting with the year YYYY-
    const records = await Attendance.find({ date: { $regex: `^${year}-` } })
      .populate('employee', 'name department empId');
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAttendanceByDate,
  getAttendanceByYear,
  upsertAttendance,
};
