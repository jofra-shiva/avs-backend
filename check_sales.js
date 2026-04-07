const mongoose = require('mongoose');
const Sale = require('./models/Sale');
require('dotenv').config();

async function checkSales() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/avseco');
    const sales = await Sale.find().limit(5);
    console.log(JSON.stringify(sales, null, 2));
    process.exit();
}

checkSales();
