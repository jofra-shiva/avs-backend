const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Load env vars at the very top
dotenv.config();

const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const clientRoutes = require('./routes/clientRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const productionRoutes = require('./routes/productionRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const productionTargetRoutes = require('./routes/productionTargetRoutes');
const salesRoutes = require('./routes/salesRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Enable CORS - Using environment variable from Vercel where possible
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, "");
  
  // Whitelist based on environment variable and standard defaults
  const allowedOrigins = [
    'https://avseco-f.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    frontendUrl
  ].filter(Boolean);

  if (!origin) {
    // Allow non-browser requests
    next();
  } else if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  } else {
    // Even if origin is not explicitly allowed, we should still handle preflights gracefully
    // to avoid hard crashes, but strictly we don't send the allow-origin header.
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', origin); // Temporary allow for debug
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
      return res.status(200).end();
    }
    next();
  }
});

// Body parser
app.use(express.json());

let initPromise = null;

/**
 * Initialize core services (DB connection, admin bootstrap, index cleanup)
 * This is designed to run once per cold start and handle concurrent requests gracefully.
 */
const initializeApp = async () => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const conn = await connectDB();
      if (!conn) {
        console.error('Database connection failed during initialization');
        return false;
      }

      // --- BOOTSTRAP ADMIN (ONE-TIME SETUP) ---
      const Employee = require('./models/Employee');
      const adminEmail = 'admin@avseco.in';
      const adminPassword = 'ceo@avseco';
      
      const adminData = {
        name: 'Administrator',
        email: adminEmail,
        username: adminEmail,
        password: adminPassword,
        role: 'admin',
        department: 'Management',
        modules: ["dashboard", "stock", "products", "production", "employees", "attendance", "clients", "sales", "reports"]
      };

      const admin = await Employee.findOne({ email: adminEmail });
      
      if (admin) {
        // Compare current state to avoid redundant updates and hashing
        const modulesChanged = JSON.stringify(admin.modules?.sort()) !== JSON.stringify(adminData.modules.sort());
        const credentialsChanged = admin.visiblePassword !== adminPassword || admin.username !== adminEmail || admin.role !== 'admin';

        if (modulesChanged || credentialsChanged) {
          admin.password = adminPassword;
          admin.role = 'admin';
          admin.modules = adminData.modules;
          admin.username = adminEmail;
          await admin.save();
          console.log(`✅ Bootstrap: Updated admin account configurations: ${adminEmail}`);
        }
      } else {
        await Employee.create(adminData);
        console.log(`✅ Bootstrap: Created new admin account: ${adminEmail}`);
      }

      // --- DATABASE INDEX CLEANUP ---
      try {
        const Product = require('./models/Product');
        // Drop the problematic unique index on the 'size' field if it exists
        await Product.collection.dropIndex("size_1");
        console.log("Successfully validated 'size' index status");
      } catch (err) {
        // Error code 27 means the index doesn't exist, which is our goal
        if (err.code !== 27) {
          console.log("Database index cleanup note:", err.message);
        }
      }

      return true;
    } catch (err) {
      console.error("Initialization failed:", err.message);
      initPromise = null; // Allow retry on next request
      return false;
    }
  })();

  return initPromise;
};

// Global middleware to ensure initialization is complete before handling requests
app.use(async (req, res, next) => {
  // Skip initialization check for health endpoint if needed, or include it
  const success = await initializeApp();
  
  if (!success && req.path !== '/api/health') {
    return res.status(503).json({ 
      message: 'System is initializing or database is unavailable. Please try again in a moment.' 
    });
  }
  next();
});

// Basic health check for development & heartbeat
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/production-targets', productionTargetRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Silent favicon handler to prevent 404 logs
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/favicon.png', (req, res) => res.status(204).end());

// Root route
app.get('/', (req, res) => {
  res.send('AVSECO API is running...');
});

// Error middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});

module.exports = app;

