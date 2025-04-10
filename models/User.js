const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  active: {
    type: Boolean,
    default: true
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Password hash middleware
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(12);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to handle failed login attempts
UserSchema.methods.incrementLoginAttempts = async function() {
  // If account lock has expired, reset attempts and remove lock
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise increment login attempts
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock the account if we've reached the max attempts (5)
  if (this.loginAttempts + 1 >= 5 && !this.lockUntil) {
    // Lock for 1 hour
    updates.$set = { lockUntil: new Date(Date.now() + 60 * 60 * 1000) };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Create a static method to initialize with default admin if none exists
UserSchema.statics.initializeAdmin = async function() {
  const adminCount = await this.countDocuments({ role: 'admin' });
  
  if (adminCount === 0) {
    // Create default admin user - you should change this password after first login!
    await this.create({
      username: 'admin',
      password: process.env.ADMIN_PASSWORD || 'savika2024',
      role: 'admin'
    });
    console.log('Admin user created successfully');
  }
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
