const medicalTravelReportService = require('../services/ai/medicalTravelReportService');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');

/**
 * Generate a medical travel report for a patient
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.generateMedicalTravelReport = async (req, res, next) => {
  try {
    const { patientId, language = 'english' } = req.body;
    
    // Validate input
    if (!patientId) {
      return next(new AppError('Patient ID is required', 400));
    }
    
    // Generate the report
    const report = await medicalTravelReportService.generateReport(patientId, language);
    
    // Return the report
    res.status(200).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    logger.error(`Error generating medical travel report: ${error.message}`);
    next(error);
  }
};

/**
 * Get all patients for dropdown selection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getPatientsList = async (req, res, next) => {
  try {
    // Get all patients
    const patients = await Patient.findAll();
    
    // Format for dropdown
    const formattedPatients = patients.map(patient => ({
      id: patient.id,
      name: `${patient.firstName} ${patient.lastName}`,
      gender: patient.gender,
      age: calculateAge(patient.dateOfBirth)
    }));
    
    // Return the patients list
    res.status(200).json({
      status: 'success',
      data: formattedPatients
    });
  } catch (error) {
    logger.error(`Error getting patients list: ${error.message}`);
    next(error);
  }
};

/**
 * Get patient data with visits
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.getPatientWithVisits = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    
    // Get patient data
    const patient = await Patient.findById(patientId);
    
    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }
    
    // Get patient visits
    const visits = await Visit.findByPatientId(patientId);
    
    // Return the patient with visits
    res.status(200).json({
      status: 'success',
      data: {
        patient,
        visits
      }
    });
  } catch (error) {
    logger.error(`Error getting patient with visits: ${error.message}`);
    next(error);
  }
};

/**
 * Get supported languages for report generation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
exports.getSupportedLanguages = (req, res) => {
  // List of supported languages
  const languages = [
    { code: 'english', name: 'English' },
    { code: 'spanish', name: 'Spanish (Español)' },
    { code: 'french', name: 'French (Français)' },
    { code: 'german', name: 'German (Deutsch)' },
    { code: 'italian', name: 'Italian (Italiano)' },
    { code: 'portuguese', name: 'Portuguese (Português)' },
    { code: 'russian', name: 'Russian (Русский)' },
    { code: 'chinese', name: 'Chinese (中文)' },
    { code: 'japanese', name: 'Japanese (日本語)' },
    { code: 'arabic', name: 'Arabic (العربية)' }
  ];
  
  res.status(200).json({
    status: 'success',
    data: languages
  });
};

/**
 * Calculate age from date of birth
 * @param {Date} dateOfBirth - Date of birth
 * @returns {number} - Age in years
 */
function calculateAge(dateOfBirth) {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
} 