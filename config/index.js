// Load environment variables from .env file if in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

module.exports = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/nailapp',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'savika-nail-app-secret-key-change-in-production',
    name: 'savika.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },
  
  // CSRF configuration
  csrf: {
    cookie: {
      key: '_csrf',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }
  }
};
