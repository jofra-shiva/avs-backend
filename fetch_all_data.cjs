const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Mongoose Models
const Sale = require('./models/Sale');
const Product = require('./models/Product');
const Employee = require('./models/Employee');
const Client = require('./models/Client');
const Expense = require('./models/Expense');
const Production = require('./models/Production');
const Attendance = require('./models/Attendance');

const fetchFullData = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/avseco';
        await mongoose.connect(uri);
        
        const data = {};

        data.products = await Product.find().lean();
        data.sales = await Sale.find().lean();
        data.employees = await Employee.find().lean();
        data.clients = await Client.find().lean();
        data.expenses = await Expense.find().lean();
        data.production = await Production.find().lean();
        data.attendance = await Attendance.find().lean();

        console.log(JSON.stringify(data, null, 2));

        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
};

fetchFullData();
