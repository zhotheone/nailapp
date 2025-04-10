const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const NodeCache = require('node-cache');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const authRoutes = require('./routes/auth');
const { isAuthenticated, login, logout } = require('./middleware/auth');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute cache default

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Only add file transports in development environment
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.File({ filename: 'error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'combined.log' }));
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  }
})); // Security headers with CSP configured for local resources
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined')); // HTTP request logging

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Cache middleware
const cacheMiddleware = (duration) => (req, res, next) => {
  const key = `__express__${req.originalUrl || req.url}`;
  const cachedBody = cache.get(key);
  
  if (cachedBody) {
    logger.info(`Cache hit for ${key}`);
    return res.send(cachedBody);
  } else {
    logger.info(`Cache miss for ${key}`);
    res.sendResponse = res.send;
    res.send = (body) => {
      cache.set(key, body, duration);
      res.sendResponse(body);
    };
    next();
  }
};

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  dbName: process.env.DB_NAME,
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  logger.info('MongoDB connected successfully');
})
.catch((err) => {
  logger.error('MongoDB connection error: ', err);
  process.exit(1);
});

// Configure session management
app.use(session({
  secret: process.env.SESSION_SECRET || 'savika-nail-app-secret-key-change-in-production',
  name: 'savika.sid',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    dbName: process.env.DB_NAME,
    ttl: 24 * 60 * 60, // 1 day
    autoRemove: 'native',
    touchAfter: 24 * 3600 // Only update the session once per day
  }),
  cookie: {
    httpOnly: true,
    // Don't require HTTPS in development
    secure: process.env.NODE_ENV === 'production' ? false : false,
    sameSite: 'lax', // Changed from 'strict' to 'lax' for Vercel
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
  }
}));

// Initialize default admin user
mongoose.connection.once('open', async () => {
  await User.initAdminUser();
});

// Apply authentication middleware to all routes
app.use(isAuthenticated);

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Set session
    req.session.userId = user._id;
    req.session.isAuthenticated = true; // Add an explicit auth flag
    
    // Save session explicitly and wait for it
    await new Promise((resolve, reject) => {
      req.session.save(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    logger.info(`User logged in: ${username}, session ID: ${req.session.id}`);
    
    // Send success response with session info for debugging
    res.json({ 
      success: true,
      sessionId: req.session.id,
      userId: req.session.userId
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      logger.error('Logout error:', err);
      return res.status(500).json({ success: false, error: 'Failed to logout' });
    }
    res.json({ success: true });
  });
});

// Add authentication check endpoint for Vercel compatibility
app.get('/api/auth/check', (req, res) => {
  logger.info(`Auth check, session: ${JSON.stringify(req.session || {})}`);
  
  if (req.session && (req.session.userId || req.session.isAuthenticated)) {
    return res.json({ 
      authenticated: true,
      sessionId: req.session.id,
      userId: req.session.userId
    });
  }
  
  logger.warn('Auth check failed - no valid session');
  res.status(401).json({ 
    authenticated: false,
    sessionInfo: req.session ? 'Session exists but no userId' : 'No session'
  });
});

// Serve login page
app.get('/login', (req, res) => {
  // If already logged in, redirect to home
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Import routes
const appointmentRoutes = require('./routes/appointments');
const clientRoutes = require('./routes/clients');
const procedureRoutes = require('./routes/procedures');
const statsRoutes = require('./routes/stats');

// Use routes
app.use('/api/appointments', appointmentRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/procedures', procedureRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/auth', authRoutes);

// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Export for testing and Vercel compatibility
module.exports = app;

// Only listen when running directly (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}
