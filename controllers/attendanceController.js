const Attendance = require('../models/Attendance');

// @desc    Get attendance for a date
// @route   GET /api/attendance/:date
// @access  Private
const getAttendanceByDate = async (req, res) => {
  try {
    const records = await Attendance.find({ date: req.params.date });
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
    res.json(updatedRecords);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAttendanceByDate,
  upsertAttendance,
};
