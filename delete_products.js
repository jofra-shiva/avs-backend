require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/Product');

const deleteProducts = async () => {
    try {
        await connectDB();
        const res = await Product.deleteMany({});
        console.log(`Successfully deleted ${res.deletedCount} products from DB.`);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
};

deleteProducts();
