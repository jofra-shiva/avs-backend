const mongoose = require('mongoose');
const Production = require('./models/Production');
const Sale = require('./models/Sale');
const Product = require('./models/Product');
const dotenv = require('dotenv');

dotenv.config();

async function resetAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    console.log('Clearing Production records...');
    await Production.deleteMany({});
    
    console.log('Clearing Sales records...');
    await Sale.deleteMany({});
    
    console.log('Resetting Product initial stocks to 0...');
    await Product.updateMany({}, { $set: { stock: 0 } });

    console.log('SUCCESS: All stock data has been reset to 0.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetAll();
