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

// Enable CORS - Optimized for Vercel & Development
const allowedOrigins = [
  'https://avseco-f.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.replace(/\/$/, "");
    
    // Allow if in whitelist OR if it's a Vercel deployment
    const isAllowed = allowedOrigins.includes(normalizedOrigin) || 
                      normalizedOrigin.endsWith('.vercel.app');
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS block for origin:', origin);
      callback(null, false); // No error, just don't allow
    }
  },
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browser support
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Body parser
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

