const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const connectDB = require('./config/database');

const app = express();

connectDB();

app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

app.use('/api/users', require('./routes/users'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/withdrawals', require('./routes/withdrawals'));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 Sohoj Income Backend is running smoothly!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Sohoj Income API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      referrals: '/api/referrals',
      withdrawals: '/api/withdrawals'
    }
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist.`
  });
});

app.use((error, req, res, next) => {
  console.error('🚨 Global Error Handler:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : error.message
  });
});

process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT received, shutting down gracefully');
  process.exit(0);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  🚀 Sohoj Income Backend Server Started!
  
  📊 Environment: ${process.env.NODE_ENV || 'development'}
  🌐 Server URL: http://localhost:${PORT}
  🗄️  Database: MongoDB Atlas
  ⏰ Started at: ${new Date().toISOString()}
  
  📍 Available Endpoints:
  ✅ Health Check: http://localhost:${PORT}/health
  ✅ API Info: http://localhost:${PORT}/api
  ✅ Users API: http://localhost:${PORT}/api/users
  ✅ Referrals API: http://localhost:${PORT}/api/referrals
  ✅ Withdrawals API: http://localhost:${PORT}/api/withdrawals
  
  🔄 Server is ready to handle requests...
  `);
});

module.exports = app;