const mongoose = require('mongoose');
const fs = require('fs');

const dotenv = require('dotenv');
dotenv.config();

// Models
const Sale = require('./models/Sale');
const Product = require('./models/Product');
const Client = require('./models/Client');
const Expense = require('./models/Expense');

const printSummary = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/avseco';
        await mongoose.connect(uri);
        
        let output = "";

        output += "\n--- PRODUCTS ---\n";
        output += "Name | Size | Price | Stock\n";
        const products = await Product.find().lean();
        products.forEach(p => output += `${p.name} | ${p.size} | ${p.sellPrice} | ${p.stock}\n`);

        output += "\n--- RECENT SALES ---\n";
        output += "Invoice | Customer | Amount | Status\n";
        const sales = await Sale.find().sort({ createdAt: -1 }).limit(10).lean();
        sales.forEach(s => output += `${s.invoiceNo} | ${s.customer} | ${s.totalAmount} | ${s.paidStatus}\n`);

        output += "\n--- CLIENTS ---\n";
        output += "Company | Contact | Phone\n";
        const clients = await Client.find().lean();
        clients.forEach(c => output += `${c.companyName} | ${c.contactPerson} | ${c.phone}\n`);

        output += "\n--- RECENT EXPENSES ---\n";
        output += "Description | Amount | Date\n";
        const expenses = await Expense.find().sort({ date: -1 }).limit(10).lean();
        expenses.forEach(e => output += `${e.description} | ${e.amount} | ${e.date}\n`);

        fs.writeFileSync('db_summary_utf8.txt', output, 'utf8');
        process.exit(0);
    } catch (err) {
        process.exit(1);
    }
};

printSummary();
