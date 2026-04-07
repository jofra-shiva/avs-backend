const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const SaleSchema = new mongoose.Schema({}, { strict: false });
const Sale = mongoose.model('Sale', SaleSchema);

const debugDates = async () => {
    try {
        const uri = 'mongodb://localhost:27017/avseco';
        await mongoose.connect(uri);
        console.log('✅ Connected');

        const sales = await Sale.find().limit(20);
        console.log('Sample Sale Dates and Amounts:');
        sales.forEach(s => {
            console.log(`Date: "${s.date}" | Amount: ${s.totalAmount || s.amount} | ID: ${s._id}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugDates();
