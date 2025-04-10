const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const csrf = require('csurf');
const helmet = require('helmet');
const { isAuthenticated, loginLimiter } = require('./middleware/auth');
const config = require('./config');
const User = require('./models/User');

// Initialize Express app
const app = express();
const PORT = config.port;

// Connect to MongoDB
mongoose.connect(config.database.url, config.database.options)
  .then(() => {
    console.log('Connected to MongoDB');
    // Initialize admin user if needed
    User.initializeAdmin();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"]
    }
  }
}));

// Request parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  ...config.session,
  store: MongoStore.create({
    mongoUrl: config.database.url,
    ttl: 24 * 60 * 60, // 1 day
    autoRemove: 'native'
  })
}));

// Apply CSRF protection (except for the login route)
app.use(function(req, res, next) {
  if (req.path === '/api/auth/login') {
    return next();
  }
  csrf(config.csrf)(req, res, next);
});

// Add CSRF token to response locals
app.use(function(req, res, next) {
  if (req.csrfToken) {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
});

// Apply authentication middleware to protect routes
app.use(isAuthenticated);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Authentication routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Import and use other API routes
// ...existing api routes...

// Serve login page
app.get('/login', (req, res) => {
  // Check if already logged in
  if (req.session?.userId) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Error handler middleware
app.use((err, req, res, next) => {
  // Handle CSRF token errors
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid CSRF token. Form expired. Please refresh the page.' });
  }
  
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});