const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const formRoutes = require('./routes/forms');
const airtableRoutes = require('./routes/airtable');
const webhookRoutes = require('./routes/webhooks');
const uploadRoutes = require('./routes/upload');

const app = express();

// Helper function to extract origin from URL
const getOrigin = (url) => {
  if (!url) return 'http://localhost:5173';
  try {
    const urlObj = new URL(url);
    return urlObj.origin; // Returns protocol + hostname + port
  } catch {
    return url; // If not a valid URL, return as-is
  }
};

// Middleware
app.use(cors({
  origin: getOrigin(process.env.FRONTEND_URL),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files as static content
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root endpoint (CORS-friendly for any origin)
app.get('/', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.json({
    status: 'ok',
    message: 'Airtable Form Builder API',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint (CORS-friendly for any origin)
app.get('/health', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/airtable', airtableRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/webhooks', webhookRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/airtable-form-builder';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});

module.exports = app;
