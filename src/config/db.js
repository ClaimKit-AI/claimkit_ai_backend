const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./config');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.db.uri, {
      // Using newer Mongoose options
    });
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 