const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Mongoose Models - Using existing schema patterns
const Sale = require('./models/Sale');
const Product = require('./models/Product');
const Employee = require('./models/Employee');
const Client = require('./models/Client');

const fetchAllData = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/avseco';
        console.log(`\n🔍 Fetching data from: ${uri}\n`);
        
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        // Fetch counts
        const productCount = await Product.countDocuments();
        const saleCount = await Sale.countDocuments();
        const employeeCount = await Employee.countDocuments();
        const clientCount = await Client.countDocuments();

        console.log(`\n📊 DATABASE SUMMARY:`);
        console.log(`-----------------------------`);
        console.log(`📦 Products:  ${productCount}`);
        console.log(`💰 Sales:     ${saleCount}`);
        console.log(`👥 Employees: ${employeeCount}`);
        console.log(`🤝 Clients:   ${clientCount}`);
        console.log(`-----------------------------\n`);

        // Fetch Recent Sales (Top 5)
        if (saleCount > 0) {
            console.log(`💰 RECENT SALES (Top 5):`);
            const recentSales = await Sale.find().sort({ createdAt: -1 }).limit(5);
            recentSales.forEach((sale, i) => {
                console.log(`${i+1}. INV: ${sale.invoiceNo} | Customer: ${sale.customer || 'N/A'} | Amount: ₹${sale.totalAmount || sale.amount}`);
            });
        }

        // Fetch Products (Top 5)
        if (productCount > 0) {
            console.log(`\n📦 PRODUCTS LIST (Top 5):`);
            const products = await Product.find().limit(5);
            products.forEach((p, i) => {
                console.log(`${i+1}. ${p.name} | Size: ${p.size} | Price: ₹${p.sellPrice}`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error fetching data:', err.message);
        process.exit(1);
    }
};

fetchAllData();
