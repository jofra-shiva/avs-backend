const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  status: { type: String, enum: ['present', 'absent', 'half'], default: 'present' },
  note: { type: String },
  halfDayTime: {
    from: { type: String },
    to: { type: String }
  },
  recordedBy: { type: String }
}, { timestamps: true });

// Ensure one record per employee per day
attendanceSchema.index({ date: 1, employee: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
