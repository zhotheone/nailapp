const express = require('express');
const router = express.Router();
const { login, logout, loginLimiter } = require('../middleware/auth');
const User = require('../models/User');

// Login route with rate limiting
router.post('/login', loginLimiter, login);

// Logout route
router.post('/logout', logout);

// Route to check authentication status
router.get('/status', async (req, res) => {
  if (req.session?.userId) {
    try {
      const user = await User.findById(req.session.userId).select('-password');
      if (user && user.active) {
        return res.json({
          authenticated: true,
          user: {
            username: user.username,
            role: user.role
          }
        });
      }
    } catch (err) {
      console.error('Auth status error:', err);
    }
  }
  
  res.json({ authenticated: false });
});

// Protected route to change password (requires authentication)
router.post('/change-password', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }
    
    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
