const express = require('express');
const router = express.Router();
const { login, logout, loginLimiter } = require('../middleware/auth');

// Login route with rate limiting
router.post('/login', loginLimiter, login);

// Logout route
router.post('/logout', logout);

// Authentication status check route
router.get('/status', (req, res) => {
  console.log('Status check, session:', req.session ? 
    `ID: ${req.session.id}, User: ${req.session.userId}, Auth: ${req.session.isAuthenticated}` : 
    'No session');
    
  if (req.session && (req.session.userId || req.session.isAuthenticated)) {
    return res.json({ 
      authenticated: true,
      sessionId: req.session.id,
      userId: req.session.userId 
    });
  }
  res.status(401).json({ authenticated: false });
});

// Add the /check endpoint that client code is expecting
router.get('/check', (req, res) => {
  console.log('Check endpoint, session:', req.session ? 
    `ID: ${req.session.id}, User: ${req.session.userId}, Auth: ${req.session.isAuthenticated}` : 
    'No session');
    
  if (req.session && (req.session.userId || req.session.isAuthenticated)) {
    return res.json({ 
      authenticated: true,
      sessionId: req.session.id,
      userId: req.session.userId 
    });
  }
  res.status(401).json({ 
    authenticated: false,
    sessionInfo: req.session ? 'Session exists but no userId' : 'No session'
  });
});

module.exports = router;
