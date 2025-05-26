const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const logger = require('../utils/logger');

// Test Firebase connection
router.get('/test', async (req, res) => {
  try {
    // Create a test collection reference
    const testCollection = db.collection('test');
    
    // Generate a unique document ID
    const docId = `test-${Date.now()}`;
    
    // Add a test document
    await testCollection.doc(docId).set({
      message: 'Firebase connection test successful',
      timestamp: new Date().toISOString()
    });
    
    // Read the document back
    const docSnapshot = await testCollection.doc(docId).get();
    
    if (docSnapshot.exists) {
      // Delete the test document (cleanup)
      await testCollection.doc(docId).delete();
      
      res.status(200).json({
        status: 'success',
        message: 'Firebase connection test successful',
        data: docSnapshot.data()
      });
    } else {
      throw new Error('Failed to read test document');
    }
  } catch (error) {
    logger.error(`Firebase test error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Firebase connection test failed',
      error: error.message
    });
  }
});

module.exports = router; 