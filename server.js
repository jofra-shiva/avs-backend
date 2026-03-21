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

const app = express();

// 1. ABSOLUTE TOP: Manual CORS Fallback for Vercel/Serverless
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Allow all .vercel.app origins or the main ones
  if (origin && (origin.endsWith('.vercel.app') || origin.includes('localhost'))) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*'); // Default fallback
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight immediately before anything else
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// 2. Official CORS Middleware (Lenient)
app.use(cors({
  origin: true, // Echoes the request's origin
  credentials: true,
  optionsSuccessStatus: 200
}));

// 3. Body parser
app.use(express.json());

let indexCleaned = false;
app.use(async (req, res, next) => {
  try {
    const conn = await connectDB();
    if (!conn) {
      return res.status(500).json({ 
        message: 'Database Connection Error. Please verify MONGO_URI and IP Whitelisting.' 
      });
    }

    // Vercel-compatible: Cleanup broken database index on the FIRST request after server start
    if (!indexCleaned) {
      try {
        const Product = require('./models/Product');
        // Drop the problematic unique index on the 'size' field
        await Product.collection.dropIndex("size_1");
        console.log("Successfully removed broken unique index on 'size'");
        indexCleaned = true;
      } catch (err) {
        // Error code 27 means the index doesn't exist, which is fine
        if (err.code === 27) {
          indexCleaned = true; 
        } else {
          console.log("Database index cleanup note:", err.message);
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
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

