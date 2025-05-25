const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Sign JWT token for a user
 */
const signToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

/**
 * Create and send JWT token in response
 */
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

/**
 * Register a new user
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Create user
    const newUser = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    // Generate and save API key
    const apiKey = await newUser.generateApiKey();

    // Return with token and API key
    createSendToken(newUser, 201, res);
  } catch (error) {
    next(new AppError(`Registration failed: ${error.message}`, 400));
  }
};

/**
 * Login a user
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // Send token to client
    createSendToken(user, 200, res);
  } catch (error) {
    next(new AppError(`Login failed: ${error.message}`, 500));
  }
};

/**
 * Protect routes - authenticate user with JWT
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    next(new AppError(`Authentication error: ${error.message}`, 401));
  }
};

/**
 * Authorize user roles
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

/**
 * Authenticate with API key
 */
exports.authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return next(new AppError('API key is required', 401));
    }

    // Find user with the API key
    const user = await User.findOne({ apiKey }).select('+apiKey');

    if (!user) {
      return next(new AppError('Invalid API key', 401));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('User account is inactive', 401));
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    next(new AppError(`API key authentication error: ${error.message}`, 401));
  }
};

/**
 * Regenerate API key for a user
 */
exports.regenerateApiKey = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Generate new API key
    const apiKey = await user.generateApiKey();
    
    res.status(200).json({
      status: 'success',
      data: {
        apiKey
      }
    });
  } catch (error) {
    next(new AppError(`Failed to regenerate API key: ${error.message}`, 500));
  }
}; 