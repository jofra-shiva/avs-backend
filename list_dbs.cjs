const mongoose = require('mongoose');

const listDBs = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017');
        const admin = mongoose.connection.useDb('admin').db.admin();
        const dbs = await admin.listDatabases();
        console.log('Databases:', dbs.databases.map(db => db.name));
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

listDBs();
