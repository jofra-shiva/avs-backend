const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const User = require('./models/User');
const Employee = require('./models/Employee');
const Client = require('./models/Client');
const Expense = require('./models/Expense');
const Product = require('./models/Product');
const Production = require('./models/Production');
const Attendance = require('./models/Attendance');

dotenv.config();

const employeesData = [
    { empId: "EMP-001", name: "Rajesh Kumar", department: "Ceo", email: "rajesh.k@avseco.com", phone: "+91 98765 43210", joinDate: "2020-01-15", dob: "1985-06-15", aadhar: "1234 5678 9012", pan: "ABCDE1234F", address: "123, Gandhi Road, Chennai", salary: 75000 },
    { empId: "EMP-002", name: "Priya Sharma", department: "Operator", email: "priya.s@avseco.com", phone: "+91 98765 43211", joinDate: "2021-03-10", dob: "1990-08-22", aadhar: "9876 5432 1098", pan: "WXYZ5678A", address: "45, Industrial Estate, Coimbatore", salary: 25000 },
    { empId: "EMP-003", name: "Amit Patel", department: "It admin", email: "amit.p@avseco.com", phone: "+91 98765 43212", joinDate: "2021-06-22", dob: "1992-11-05", aadhar: "4567 8901 2345", pan: "PQRS9012B", address: "78, Main Street, Trichy", salary: 45000 },
    { empId: "EMP-004", name: "Sneha Reddy", department: "Hr", email: "sneha.r@avseco.com", phone: "+91 98765 43213", joinDate: "2022-01-05", dob: "1994-03-30", aadhar: "3210 9876 5432", pan: "LMNO3456C", address: "12, Lake View Road, Madurai", salary: 35000 },
    { empId: "EMP-005", name: "Vikram Singh", department: "Machine operator", email: "vikram.s@avseco.com", phone: "+91 98765 43214", joinDate: "2022-09-18", dob: "1996-07-12", aadhar: "7890 1234 5678", pan: "DEFG7890H", address: "89, Cross Street, Salem", salary: 28000 },
    { empId: "EMP-006", name: "Anjali Mehta", department: "Hr", email: "anjali.m@avseco.com", phone: "+91 98765 43215", joinDate: "2021-11-30", dob: "1993-01-25", aadhar: "5678 9012 3456", pan: "JKLM1234K", address: "23, Park Avenue, Chennai", salary: 35000 },
    { empId: "EMP-007", name: "Karthik Rajan", department: "Operator", email: "karthik.r@avseco.com", phone: "+91 98765 43216", joinDate: "2022-02-14", dob: "1995-09-08", aadhar: "0123 4567 8901", pan: "UVWX5678L", address: "56, Temple Street, Madurai", salary: 20000 },
    { empId: "EMP-008", name: "Lakshmi Nair", department: "Hr", email: "lakshmi.n@avseco.com", phone: "+91 98765 43217", joinDate: "2021-08-19", dob: "1988-04-18", aadhar: "2345 6789 0123", pan: "QRST9012M", address: "34, River Side, Coimbatore", salary: 32000 },
    { empId: "EMP-009", name: "Manoj Kumar", department: "Driver", email: "manoj.k@avseco.com", phone: "+91 98765 43218", joinDate: "2022-05-23", dob: "1991-12-03", aadhar: "6789 0123 4567", pan: "NOPQ3456N", address: "90, West Lane, Trichy", salary: 18000 },
    { empId: "EMP-010", name: "Divya Krishnan", department: "Cleaning", email: "divya.k@avseco.com", phone: "+91 98765 43219", joinDate: "2021-11-11", dob: "1989-10-28", aadhar: "8901 2345 6789", pan: "HIJK7890P", address: "67, East Coast Road, Chennai", salary: 15000 }
];

const clientsData = [
    {
        companyName: "Eco Products Ltd",
        contactPerson: "Rahul Sharma",
        email: "rahul@ecoproducts.com",
        phone: "+91 98765 43210",
        status: "Active",
        totalOrders: 45,
        totalSpent: "₹12,45,000",
        lastOrder: "2026-02-10",
        address: "123 Green Street, Mumbai - 400001",
        gst: "27ABCDE1234F1Z5",
    },
    {
        companyName: "Green Earth Solutions",
        contactPerson: "Priya Patel",
        email: "priya@greenearth.com",
        phone: "+91 87654 32109",
        status: "Active",
        totalOrders: 38,
        totalSpent: "₹8,90,500",
        lastOrder: "2026-02-08",
        address: "456 Eco Park, Delhi - 110001",
        gst: "07FGHIJ5678K2L6",
    }
];

const expensesData = [
    { category: "Machine Maintenance", description: "Repair of CNC Machine", amount: 15000, date: "2026-02-18", paymentMode: "Bank Transfer" },
    { category: "Material", description: "Raw Material – Steel Sheets", amount: 45000, date: "2026-02-19", paymentMode: "Cheque" },
    { category: "Salary", description: "Advance Salary for Rahul", amount: 5000, date: "2026-02-10", paymentMode: "Cash" },
    { category: "Others", description: "Office Stationery", amount: 1200, date: "2026-01-15", paymentMode: "UPI" },
];

const productsData = [
    { name: "Areca Plate", sku: "ARP-6RND-01", size: "6-inch", stock: 15200, value: "₹15.2 L", costPrice: 2, sellPrice: 4 },
    { name: "Areca Plate", sku: "ARP-8RND-01", size: "8-inch", stock: 11800, value: "₹11.8 L", costPrice: 3, sellPrice: 6 },
    { name: "Areca Plate", sku: "ARP-10RND-01", size: "10-inch", stock: 9200, value: "₹9.2 L", costPrice: 4, sellPrice: 8 },
    { name: "Areca Plate", sku: "ARP-12RND-01", size: "12-inch", stock: 7600, value: "₹7.6 L", costPrice: 5, sellPrice: 10 },
];

const productionData = [
    { date: "2026-02-20", size: "6-inch", count: 1450, efficiency: "96%" },
    { date: "2026-02-20", size: "8-inch", count: 1220, efficiency: "94%" },
    { date: "2026-02-20", size: "10-inch", count: 850, efficiency: "89%" },
    { date: "2026-02-20", size: "12-inch", count: 620, efficiency: "92%" },
];

const importData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await Employee.deleteMany();
        await Client.deleteMany();
        await Expense.deleteMany();
        await Product.deleteMany();
        await Production.deleteMany();
        await Attendance.deleteMany();

        console.log('Existing data cleared.');

        // Import Employees
        const createdEmployees = await Employee.insertMany(employeesData);
        console.log(`${createdEmployees.length} employees imported.`);

        // Import Clients
        await Client.insertMany(clientsData);
        console.log('Clients imported.');

        // Import Expenses
        await Expense.insertMany(expensesData);
        console.log('Expenses imported.');

        // Import Products (Stock)
        await Product.insertMany(productsData);
        console.log('Products imported.');

        // Import Production
        await Production.insertMany(productionData);
        console.log('Production records imported.');

        // Generate some sample attendance for today
        const today = new Date("2026-02-20");
        const attendanceRecords = createdEmployees.map(emp => ({
            date: today,
            employee: emp._id,
            status: Math.random() > 0.1 ? 'present' : 'absent',
            note: ''
        }));
        await Attendance.insertMany(attendanceRecords);
        console.log('Sample attendance records imported.');

        console.log('Data Seeding Completed Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

importData();
