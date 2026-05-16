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
const turnoverRoutes = require('./routes/turnoverRoutes');

const User = require('./models/User');
const Employee = require('./models/Employee');

const app = express();

// Enable CORS using standard middleware for better compatibility
const allowedOrigins = [
  'https://avseco-f.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  process.env.FRONTEND_URL?.replace(/\/$/, "")
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow any origin for better compatibility, or restrict to allowedOrigins in production
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['X-CSRF-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Content-Type', 'Date', 'X-Api-Version', 'Authorization']
}));

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
        console.error("❌ [Init] Database connection failed.");
        return false;
      }

      // --- CRITICAL BOOTSTRAP: RUNS ONCE PER COLD START ---
      try {
        const adminEmail = 'avsecoindustries@gmail.com';
        const adminPassword = 'avsecoindustries';
        const oldAdminEmail = 'admin@avseco.in';

        console.log(`[Init] Validating Admin Account: ${adminEmail}`);

        // 1. Cleanup old/junk/non-admin accounts from User collection
        // Use individual catch blocks to ensure one failure doesn't stop the rest
        const cleanupTasks = [
          User.deleteMany({ email: oldAdminEmail }).catch(e => console.error("[Init] Error cleaning old admin user:", e.message)),
          Employee.deleteMany({ email: oldAdminEmail }).catch(e => console.error("[Init] Error cleaning old admin employee:", e.message)),
          // Remove non-admin records from the 'User' collection
          User.deleteMany({
            $and: [
              { email: { $ne: adminEmail } },
              { role: { $ne: 'admin' } }
            ]
          }).catch(e => console.error("[Init] Error cleaning non-admin users:", e.message)),
          User.deleteMany({ name: { $in: ["", null, "John Doe", "Test User"] } }).catch(e => console.error("[Init] Error cleaning junk users:", e.message)),
          Employee.deleteMany({ name: { $in: ["", null, "John Doe", "Test User"] } }).catch(e => console.error("[Init] Error cleaning junk employees:", e.message))
        ];

        await Promise.all(cleanupTasks);

        // 2. Force Admin in Employee Collection
        let adminEmp = await Employee.findOne({ $or: [{ email: adminEmail }, { role: 'admin' }] });
        if (adminEmp) {
          adminEmp.email = adminEmail;
          adminEmp.username = adminEmail;
          adminEmp.password = adminPassword;
          adminEmp.role = 'admin';
          adminEmp.isFirstLogin = false;
          adminEmp.modules = ["dashboard", "stock", "products", "production", "employees", "attendance", "clients", "sales", "reports", "expenses", "notifications", "turnover"];
          await adminEmp.save();
        } else {
          await Employee.create({
            name: 'Admin User',
            email: adminEmail,
            username: adminEmail,
            password: adminPassword,
            role: 'admin',
            department: 'Management',
            isFirstLogin: false,
            modules: ["dashboard", "stock", "products", "production", "employees", "attendance", "clients", "sales", "reports", "expenses", "notifications", "turnover"]
          });
        }

        // 3. Force Admin in User Collection
        await User.findOneAndUpdate(
          { $or: [{ email: adminEmail }, { role: 'admin' }] },
          { name: 'Admin User', email: adminEmail, password: adminPassword, role: 'admin' },
          { upsert: true }
        );

        console.log(`✅ [Init] Admin Credentials Verified for ${adminEmail}`);
      } catch (e) {
        console.error("⚠️ [Init] Bootstrap warning (system may still work):", e.message);
      }

      return true;
    } catch (err) {
      console.error("❌ [Init] Initialization CRITICAL error:", err.message);
      initPromise = null; // Allow retry on next request
      return false;
    }
  })();

  return initPromise;
};

// Global middleware to ensure initialization is complete before handling requests
app.use(async (req, res, next) => {
  // Skip initialization check for health endpoint
  if (req.originalUrl === '/api/health') {
    return next();
  }

  console.log(`[Request] ${req.method} ${req.originalUrl}`);

  // Pre-check for MONGO_URI
  if (!process.env.MONGO_URI) {
    console.error('[Critical] MONGO_URI is missing from environment variables');
    return res.status(503).json({
      message: 'Database Configuration Error',
      details: 'MONGO_URI is not defined. Please check environment variables.'
    });
  }

  const success = await initializeApp();

  if (!success) {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    console.error(`[Init] System not ready for ${req.method} ${req.originalUrl} | DB: ${dbStatus}`);
    return res.status(503).json({
      message: 'System Initializing',
      details: dbStatus === 'Disconnected' ? 'Database connection could not be established.' : 'System bootstrap is in progress or failed. Please refresh in a moment.',
      dbStatus
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
app.use('/api/turnover', turnoverRoutes);
app.use('/api/analytics', turnoverRoutes);

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

const PORT = process.env.PORT || 5555;

app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});

module.exports = app;

