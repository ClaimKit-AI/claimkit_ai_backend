require('dotenv').config();
const logger = require('../utils/logger');
const mockData = require('../utils/mockDataGenerator');

/**
 * Seed the database with mock data
 */
async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');
    
    // Generate all mock data
    const { patients, visits } = await mockData.generateAll(10, 3);
    
    logger.info(`Seeding complete! Generated ${patients.length} patients and ${visits.length} visits.`);
    
    // Log some sample data for verification
    if (patients.length > 0) {
      logger.info('Sample patient:', JSON.stringify(patients[0], null, 2));
    }
    
    if (visits.length > 0) {
      logger.info('Sample visit:', JSON.stringify(visits[0], null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    logger.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase(); 