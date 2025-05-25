const express = require('express');
const router = express.Router();
const claimkitController = require('../controllers/claimkitController');
const authController = require('../controllers/authController');

// PUBLIC TEST ROUTES - no authentication required
// Make sure these are BEFORE the authentication middleware
router.post('/test/review-documentation', claimkitController.reviewMedicalDocumentation);
router.post('/test/enhance-notes', claimkitController.enhanceDoctorNotes);
router.post('/test/generate-claim', claimkitController.generateInsuranceClaim);
router.post('/test/handle-denial', claimkitController.handleClaimDenial);

// API key authentication middleware - all routes below require authentication
router.use(authController.authenticateApiKey);

// PROTECTED ROUTES - authentication required
router.post('/review-documentation', claimkitController.reviewMedicalDocumentation);
router.post('/enhance-notes', claimkitController.enhanceDoctorNotes);
router.post('/generate-claim', claimkitController.generateInsuranceClaim);
router.post('/handle-denial', claimkitController.handleClaimDenial);

module.exports = router; 