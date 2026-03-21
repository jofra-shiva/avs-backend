const mongoose = require('mongoose');
require('dotenv').config();

// Define Schema for seeding (same as models/Employee.js)
const employeeSchema = mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  email: { type: String },
  phone: { type: String, unique: true },
  empId: { type: String, unique: true },
  joinDate: { type: Date },
  dob: { type: String },
  aadhar: { type: String, unique: true },
  pan: { type: String },
  address: { type: String },
  salary: { type: Number },
  avatar: { type: String },
}, { timestamps: true });

employeeSchema.pre('save', function(next) {
  if (!this.empId) {
    this.empId = 'EMP-' + Math.floor(100000 + Math.random() * 900000);
  }
  next();
});

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

const sampleEmployees = [
  {
    name: "Anita R",
    department: "Hr",
    email: "hr@avseco.in",
    phone: "+91 9876543210",
    joinDate: new Date("2025-01-10"),
    dob: "1995-05-12",
    aadhar: "1234 5678 9012",
    pan: "ABCDE1234A",
    address: "12, HR Avenue, Chennai",
    salary: 45000
  },
  {
    name: "Rahul Tech",
    department: "It admin",
    email: "it@avseco.in",
    phone: "+91 9123456789",
    joinDate: new Date("2024-11-15"),
    dob: "1992-08-20",
    aadhar: "2345 6789 0123",
    pan: "BCDEF2345B",
    address: "Tech Hub, Block 4, Bangalore",
    salary: 55000
  },
  {
    name: "Kumar M",
    department: "Operator",
    email: "kumar@avseco.in",
    phone: "+91 9234567890",
    joinDate: new Date("2026-02-01"),
    dob: "1988-12-25",
    aadhar: "3456 7890 1234",
    pan: "CDEFG3456C",
    address: "West Street, Coimbatore",
    salary: 25000
  },
  {
    name: "John Maintenance",
    department: "Maitanice",
    email: "john@avseco.in",
    phone: "+91 9345678901",
    joinDate: new Date("2025-06-20"),
    dob: "1990-03-30",
    aadhar: "4567 8901 2345",
    pan: "DEFGH4567D",
    address: "Factory Quarters, Plot 8",
    salary: 30000
  },
  {
    name: "Senthil Kumar",
    department: "Machine operator",
    phone: "+91 9456789012",
    joinDate: new Date("2025-09-12"),
    dob: "1985-07-15",
    aadhar: "5678 9012 3456",
    pan: "EFGHI5678E",
    address: "Ayyappan Kovil Street, Salem",
    salary: 28000
  },
  {
    name: "Priya S",
    department: "Cleaning",
    phone: "+91 9567890123",
    joinDate: new Date("2026-03-05"),
    dob: "1993-11-05",
    aadhar: "6789 0123 4567",
    pan: "FGHIJ6789F",
    address: "Colony Street, Gandhi Nagar",
    salary: 15000
  },
  {
    name: "Velu Driver",
    department: "Driver",
    phone: "+91 9678901234",
    joinDate: new Date("2024-05-20"),
    dob: "1980-01-10",
    aadhar: "7890 1234 5678",
    pan: "GHIJK7890G",
    address: "Transport Hub, 1st Cross",
    salary: 22000
  },
  {
    name: "Ganesh R",
    department: "Others",
    phone: "+91 9789012345",
    joinDate: new Date("2026-01-25"),
    dob: "1991-09-18",
    aadhar: "8901 2345 6789",
    pan: "HIJKL8901H",
    address: "Main Road, Ooty",
    salary: 18000
  }
];

async function seed() {
  try {
    const MONGO_URI = 'mongodb+srv://avseco:avseco@avseco.macunyb.mongodb.net/?appName=avseco';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    for (const emp of sampleEmployees) {
      const exists = await Employee.findOne({ phone: emp.phone });
      if (!exists) {
        await Employee.create(emp);
        console.log(`Added: ${emp.name} (${emp.department})`);
      } else {
        console.log(`Skipped: ${emp.name} (Duplicate Phone)`);
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
}

seed();
