/**
 * Authentication middleware to protect routes
 */

const User = require('../models/User');
const rateLimit = require('express-rate-limit');

// Setup rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' }
});

/**
 * Middleware to check if user is authenticated
 */
const isAuthenticated = async (req, res, next) => {
  // Skip authentication for login page and login API
  if (req.path === '/login' || req.path === '/api/auth/login') {
    return next();
  }
  
  // Check if user is logged in
  if (req.session && req.session.userId) {
    try {
      // Verify user exists
      const user = await User.findById(req.session.userId);
      if (user) {
        // Add user to request for convenience
        req.user = user;
        return next();
      }
    } catch (err) {
      console.error('Authentication error:', err);
    }
  }
  
  // API routes return 401
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Redirect to login page
  res.redirect('/login');
};

/**
 * Login handler
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      });
    }
    
    // Find the user
    const user = await User.findOne({ username });
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil - new Date()) / (60 * 1000));
      return res.status(401).json({ 
        success: false, 
        error: `Account is temporarily locked. Try again in ${minutesLeft} minutes.` 
      });
    }
    
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Update last login time
    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date()
    });
    
    // Set user ID in session
    req.session.userId = user._id;
    req.session.userRole = user.role;
    
    // Send success response
    res.json({ 
      success: true,
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
};

/**
 * Logout handler
 */
const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to logout'
      });
    }
    
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
};

// Export all functions consistently
module.exports = {
  isAuthenticated,
  login,
  loginLimiter,
  logout
};
