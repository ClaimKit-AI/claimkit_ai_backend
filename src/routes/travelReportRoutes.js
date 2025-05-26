const express = require('express');
const router = express.Router();
const firestoreService = require('../services/firestoreService');
const openaiService = require('../services/openaiService');
const logger = require('../utils/logger');

// Initialize Firestore with seed data
firestoreService.seedInitialData()
  .then(() => logger.info('Firestore data initialized for travel reports'))
  .catch(err => logger.error(`Error initializing Firestore data: ${err.message}`));

// Get all patients
router.get('/patients', async (req, res) => {
  try {
    const patients = await firestoreService.getPatients();
    
    // Enhance patients with eligibility information
    const enhancedPatients = await Promise.all(
      patients.map(async (patient) => {
        try {
          const patientWithEligibility = await firestoreService.getPatientWithEligibility(patient.id);
          return patientWithEligibility;
        } catch (error) {
          logger.error(`Error getting eligibility for patient ${patient.id}: ${error.message}`);
          // Return patient without eligibility if there's an error
          return {
            ...patient,
            isEligibleForReport: false,
            eligibilityReason: 'Error checking eligibility'
          };
        }
      })
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        patients: enhancedPatients
      }
    });
  } catch (error) {
    logger.error(`Error getting patients: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get patients',
      error: error.message
    });
  }
});

// Get available languages
router.get('/languages', async (req, res) => {
  try {
    const languages = await firestoreService.getLanguages();
    
    res.status(200).json({
      status: 'success',
      data: {
        languages
      }
    });
  } catch (error) {
    logger.error(`Error getting languages: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get languages',
      error: error.message
    });
  }
});

// Check patient eligibility
router.get('/patients/:patientId/eligibility', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Get patient with eligibility info
    const patient = await firestoreService.getPatientWithEligibility(patientId);
    
    res.status(200).json({
      status: 'success',
      data: {
        patient,
        isEligible: patient.isEligibleForReport,
        reason: patient.eligibilityReason,
        lastVisit: patient.lastVisitFormatted
      }
    });
  } catch (error) {
    logger.error(`Error checking patient eligibility: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check patient eligibility',
      error: error.message
    });
  }
});

// Generate a travel report
router.post('/generate', async (req, res) => {
  try {
    const { patientId, language } = req.body;
    
    if (!patientId) {
      return res.status(400).json({
        status: 'error',
        message: 'Patient ID is required'
      });
    }
    
    if (!language) {
      return res.status(400).json({
        status: 'error',
        message: 'Language is required'
      });
    }
    
    // Check if patient is eligible for a report
    const patient = await firestoreService.getPatientWithEligibility(patientId);
    
    if (!patient.isEligibleForReport) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot generate report: ${patient.eligibilityReason}`,
        data: {
          patient,
          isEligible: false,
          reason: patient.eligibilityReason,
          lastVisit: patient.lastVisitFormatted
        }
      });
    }
    
    // Generate report with OpenAI
    const report = await openaiService.generateTravelReport(patient, language);
    
    // Save the report to Firestore
    const savedReport = await firestoreService.saveReport({
      patientId,
      language,
      ...report
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        report: savedReport
      }
    });
  } catch (error) {
    logger.error(`Error generating travel report: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate travel report',
      error: error.message
    });
  }
});

// Get patient visits
router.get('/patients/:patientId/visits', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const visits = await firestoreService.getPatientVisits(patientId);
    
    res.status(200).json({
      status: 'success',
      data: {
        visits
      }
    });
  } catch (error) {
    logger.error(`Error getting patient visits: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get patient visits',
      error: error.message
    });
  }
});

// Process open-ended query
router.post('/query', async (req, res) => {
  try {
    const { query, patientId } = req.body;
    
    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'Query is required'
      });
    }
    
    let patient = null;
    if (patientId) {
      patient = await firestoreService.getPatientById(patientId);
    }
    
    // Process query with OpenAI
    const response = await openaiService.processTravelQuery(query, patient);
    
    res.status(200).json({
      status: 'success',
      data: {
        response
      }
    });
  } catch (error) {
    logger.error(`Error processing travel query: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process query',
      error: error.message
    });
  }
});

// Get patient reports
router.get('/patients/:patientId/reports', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const reports = await firestoreService.getPatientReports(patientId);
    
    res.status(200).json({
      status: 'success',
      data: {
        reports
      }
    });
  } catch (error) {
    logger.error(`Error getting patient reports: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get patient reports',
      error: error.message
    });
  }
});

// Keep mock endpoints for backward compatibility during transition
router.get('/mock-patients', async (req, res) => {
  try {
    const patients = await firestoreService.getPatients();
    
    // Enhance patients with eligibility information
    const enhancedPatients = await Promise.all(
      patients.map(async (patient) => {
        try {
          const patientWithEligibility = await firestoreService.getPatientWithEligibility(patient.id);
          return patientWithEligibility;
        } catch (error) {
          // Return patient without eligibility if there's an error
          return {
            ...patient,
            isEligibleForReport: false,
            eligibilityReason: 'Error checking eligibility'
          };
        }
      })
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        patients: enhancedPatients
      }
    });
  } catch (error) {
    // Fallback to mock data
    const mockPatients = [
      { id: 'p1', name: 'James Wilson', age: 42, gender: 'male', isEligibleForReport: true },
      { id: 'p2', name: 'Maria Garcia', age: 35, gender: 'female', isEligibleForReport: true },
      { id: 'p3', name: 'Robert Chen', age: 68, gender: 'male', isEligibleForReport: false },
      { id: 'p4', name: 'Sarah Johnson', age: 29, gender: 'female', isEligibleForReport: true },
      { id: 'p5', name: 'Michael Thompson', age: 57, gender: 'male', isEligibleForReport: false }
    ];
    
    res.status(200).json({
      status: 'success',
      data: {
        patients: mockPatients
      }
    });
  }
});

router.post('/mock-generate', async (req, res) => {
  // Forward to the new endpoint
  return router.handle(req, 'POST', '/generate', res);
});

module.exports = router; 