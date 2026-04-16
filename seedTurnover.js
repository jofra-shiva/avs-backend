const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Turnover = require('./models/Turnover');

const seedManualTurnovers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB...");

        // Check if data exists
        const count = await Turnover.countDocuments();
        if (count > 0) {
            console.log("Turnover records already exist. Skipping seed.");
            process.exit(0);
        }

        const sampleTurnovers = [
            { date: new Date('2026-04-10'), amount: 45000, category: 'Consulting Services', notes: 'Monthly advisory fees' },
            { date: new Date('2026-04-12'), amount: 25000, category: 'Bulk Scrap Sale', notes: 'Factory waste disposal' },
            { date: new Date('2026-04-15'), amount: 15000, category: 'Machine Rental', notes: 'Equipment leased for 3 days' },
            { date: new Date('2026-03-20'), amount: 60000, category: 'Old Motor Sale', notes: 'Inventory clearance' },
        ];

        await Turnover.insertMany(sampleTurnovers);
        console.log("Successfully seeded manual turnover records.");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seedManualTurnovers();
