const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Handle .well-known requests EARLY (before CSP middleware)
// This prevents Chrome DevTools from being blocked
app.get('/.well-known/*', (req, res) => {
  // Don't set any CSP header for this endpoint
  res.status(204).end();
});

// Override restrictive CSP headers set by Express middleware
app.use((req, res, next) => {
  // Remove any existing restrictive CSP header
  res.removeHeader('Content-Security-Policy');
  
  // Set a permissive CSP for development (only in development mode)
  if (process.env.NODE_ENV !== 'production') {
    res.setHeader('Content-Security-Policy', 
      "default-src 'self' http://localhost:* https://api.airtable.com https://*.airtable.com; " +
      "connect-src 'self' http://localhost:* https://api.airtable.com https://*.airtable.com ws://localhost:* wss://localhost:* http://localhost:5000/.well-known/* http://localhost:5000/.well-known/appspecific/* chrome-extension://*; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:;"
    );
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: true,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/form-builder', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/forms', require('./routes/forms'));
app.use('/api/airtable', require('./routes/airtable'));
app.use('/webhooks', require('./routes/webhooks'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Favicon route to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

