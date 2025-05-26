#!/usr/bin/env node

/**
 * Script to populate Firestore with detailed patient data and visit history
 * Run with: node src/scripts/runPopulateFirestore.js
 */

require('dotenv').config();
const { populateFirestore } = require('./populateFirestore');
const logger = require('../utils/logger');

logger.info('Starting Firestore population script...');

populateFirestore()
  .then(() => {
    logger.info('Firestore population completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Firestore population failed: ${error.message}`);
    process.exit(1);
  }); 