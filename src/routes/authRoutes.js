const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Dummy implementations since we're not using MongoDB
router.post('/register', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Registration endpoint (dummy implementation - database not in use)',
    data: {
      user: {
        id: 'dummy-id',
        name: req.body.name || 'Test User',
        email: req.body.email || 'test@example.com'
      }
    }
  });
});

router.post('/login', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Login endpoint (dummy implementation - database not in use)',
    data: {
      token: 'dummy-jwt-token',
      user: {
        id: 'dummy-id',
        name: 'Test User',
        email: req.body.email || 'test@example.com'
      }
    }
  });
});

// API key routes
router.post('/api-key/regenerate', 
  authController.protect, 
  authController.regenerateApiKey
);

module.exports = router; 