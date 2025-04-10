const express = require('express');
const router = express.Router();
const { login, logout, loginLimiter } = require('../middleware/auth');

// Login route with rate limiting
router.post('/login', loginLimiter, login);

// Logout route
router.post('/logout', logout);

// Authentication status check route
router.get('/status', (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({ authenticated: true });
  }
  res.status(401).json({ authenticated: false });
});

module.exports = router;
