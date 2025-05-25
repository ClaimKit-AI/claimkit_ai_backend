const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error', 
    message: `Too many requests from this IP, please try again after ${config.rateLimit.windowMs / (60 * 1000)} minutes`
  },
});

module.exports = limiter; 