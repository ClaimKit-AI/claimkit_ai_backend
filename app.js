const express = require('express');
const path = require('path');

// Create a simple express app
const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is operational',
    timestamp: new Date()
  });
});

// Handle undefined routes
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 