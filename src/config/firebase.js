const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const logger = require('../utils/logger');

// Initialize Firebase
const initFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (global.firebaseApp) {
      logger.info('Firebase already initialized');
      return getFirestore();
    }

    // If using environment variables
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      
      global.firebaseApp = initializeApp({
        credential: cert(serviceAccount)
      });
      
      logger.info('Firebase initialized with service account from environment variables');
      return getFirestore();
    }
    
    // For local development using service account file
    try {
      const serviceAccount = require('../../firebase-credentials.json');
      
      global.firebaseApp = initializeApp({
        credential: cert(serviceAccount)
      });
      
      logger.info('Firebase initialized with service account from file');
      return getFirestore();
    } catch (error) {
      // If no service account file, initialize Firebase with default config for emulator
      global.firebaseApp = initializeApp({
        projectId: 'claimkit-ai-dev',
        databaseURL: 'localhost:8080'
      });
      
      logger.info('Firebase initialized with default config for local development');
      return getFirestore();
    }
  } catch (error) {
    logger.error(`Error initializing Firebase: ${error.message}`);
    throw error;
  }
};

// Get Firestore instance
const db = initFirebase();

module.exports = { db }; 