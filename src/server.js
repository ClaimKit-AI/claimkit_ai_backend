// Load environment variables
require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load configuration
const config = require('./config/config');
const logger = require('./utils/logger');
// Commenting out database connection since it's not needed at this point
// const connectDB = require('./config/db');
const { handleError } = require('./utils/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Initialize Firebase
const { db } = require('./config/firebase');
const firestoreService = require('./services/firestoreService');

// Import routes
const authRoutes = require('./routes/authRoutes');
const templateRoutes = require('./routes/templateRoutes');
const aiRoutes = require('./routes/aiRoutes');
const claimkitRoutes = require('./routes/claimkitRoutes');
const travelReportRoutes = require('./routes/travelReportRoutes');
const firebaseRoutes = require('./routes/firebaseRoutes');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Initialize express app
const app = express();

// Comment out MongoDB connection since we're not using it
// connectDB();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: '*', // For development - change to specific domains in production
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
};
app.use(cors(corsOptions));

// Rate limiting
app.use(rateLimiter);

// Request logging in development
if (config.server.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Home page route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'ClaimKit AI Backend',
    description: 'API Hub for Healthcare AI Services',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      templates: '/api/v1/templates',
      ai: '/api/v1/ai',
      claimkit: '/api/v1/claimkit'
    },
    testEndpoint: '/api/v1/ai/test/doctor-notes/review',
    claimkitTestEndpoint: '/api/v1/claimkit/test/enhance-notes',
    documentation: 'See README.md for detailed API documentation'
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/templates', templateRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/claimkit', claimkitRoutes);
app.use('/api/v1/travel-report', travelReportRoutes);
app.use('/api/v1/firebase', firebaseRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is operational',
    environment: config.server.nodeEnv,
    timestamp: new Date()
  });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.status = 'fail';
  err.statusCode = 404;
  next(err);
});

// Global error handler
app.use(handleError);

// Initialize default templates
const seedTemplates = async () => {
  try {
    // Comment out template seeding since we're not using MongoDB
    /*
    // Import the Template model
    const Template = require('./models/Template');
    
    // Import the default template for doctor notes review
    const doctorNotesReviewTemplate = require('./templates/doctorNotesReview');
    
    // Check if the template already exists
    const existingTemplate = await Template.findOne({ name: doctorNotesReviewTemplate.name });
    
    if (!existingTemplate) {
      // Create the template if it doesn't exist
      await Template.create(doctorNotesReviewTemplate);
      logger.info(`Template ${doctorNotesReviewTemplate.name} created successfully`);
    }
    */
    logger.info('Template seeding skipped - database not in use');
  } catch (error) {
    logger.error(`Error in template initialization: ${error.message}`);
  }
};

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${config.server.nodeEnv} mode on port ${PORT}`);
  
  // Seed templates
  seedTemplates();
  
  // Initialize Firestore data
  firestoreService.seedInitialData()
    .then(() => logger.info('Firestore data initialized successfully'))
    .catch(err => logger.error(`Error initializing Firestore data: ${err.message}`));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.name}, ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app; 