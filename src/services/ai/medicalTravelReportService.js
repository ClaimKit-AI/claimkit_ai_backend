const { OpenAI } = require('openai');
const Patient = require('../../models/Patient');
const Visit = require('../../models/Visit');
const logger = require('../../utils/logger');
const config = require('../../config/config');
const { AppError } = require('../../utils/errorHandler');

/**
 * Service for generating medical travel reports
 */
class MedicalTravelReportService {
  /**
   * Initialize the OpenAI client
   */
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || config.ai.openai.apiKey
    });
    
    logger.info('Medical Travel Report Service initialized');
  }
  
  /**
   * Generate a medical travel report for a patient
   * @param {string} patientId - Patient ID
   * @param {string} language - Language for the report (default: 'english')
   * @returns {Promise<Object>} - Generated report
   */
  async generateReport(patientId, language = 'english') {
    try {
      logger.info(`Generating medical travel report for patient ${patientId} in ${language}`);
      
      // Get patient data
      const patient = await Patient.findById(patientId);
      
      if (!patient) {
        throw new AppError('Patient not found', 404);
      }
      
      // Get patient visits
      const visits = await Visit.findByPatientId(patientId);
      
      if (visits.length === 0) {
        throw new AppError('No visits found for patient', 404);
      }
      
      // Prepare patient data for the prompt
      const patientData = this.preparePatientData(patient, visits);
      
      // Generate the report
      const report = await this.callOpenAI(patientData, language);
      
      return report;
    } catch (error) {
      logger.error(`Error generating medical travel report: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Prepare patient data for the prompt
   * @param {Object} patient - Patient data
   * @param {Array} visits - Patient visits
   * @returns {Object} - Prepared patient data
   */
  preparePatientData(patient, visits) {
    // Sort visits by date (newest first)
    const sortedVisits = [...visits].sort((a, b) => 
      new Date(b.visitDate) - new Date(a.visitDate)
    );
    
    // Calculate patient age
    const birthDate = new Date(patient.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Extract relevant data
    const patientData = {
      patient: {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        age,
        gender: patient.gender,
        dateOfBirth: new Date(patient.dateOfBirth).toISOString().split('T')[0],
        contactInfo: patient.contactInfo,
        medicalHistory: patient.medicalHistory,
        insuranceInfo: patient.insuranceInfo
      },
      visits: sortedVisits.map(visit => ({
        id: visit.id,
        date: new Date(visit.visitDate).toISOString().split('T')[0],
        type: visit.visitType,
        provider: visit.providerName,
        chiefComplaint: visit.chiefComplaint,
        diagnosis: visit.diagnosis,
        procedures: visit.procedures,
        medications: visit.medications,
        vitalSigns: visit.vitalSigns,
        notes: visit.notes,
        followUp: visit.followUp
      }))
    };
    
    return patientData;
  }
  
  /**
   * Call OpenAI to generate the report
   * @param {Object} patientData - Prepared patient data
   * @param {string} language - Language for the report
   * @returns {Promise<Object>} - Generated report
   */
  async callOpenAI(patientData, language) {
    try {
      // Build the prompt
      const systemPrompt = this.buildSystemPrompt(language);
      const userPrompt = this.buildUserPrompt(patientData);
      
      // Call OpenAI
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || config.ai.openai.model || "gpt-4-turbo",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 2500,
        response_format: { type: "json_object" }
      });
      
      // Parse the response
      const report = JSON.parse(response.choices[0].message.content);
      
      // Add metadata
      report.metadata = {
        patientId: patientData.patient.id,
        generatedAt: new Date().toISOString(),
        language,
        model: process.env.OPENAI_MODEL || config.ai.openai.model || "gpt-4-turbo"
      };
      
      return report;
    } catch (error) {
      logger.error(`OpenAI API error: ${error.message}`);
      throw new AppError(`Failed to generate report: ${error.message}`, 500);
    }
  }
  
  /**
   * Build the system prompt
   * @param {string} language - Language for the report
   * @returns {string} - System prompt
   */
  buildSystemPrompt(language) {
    return `You are a medical professional tasked with creating a comprehensive medical travel report for a patient seeking healthcare services abroad. 

The report should be thorough, accurate, and formatted in a way that is easily understandable by medical professionals in other countries. 

The report should be written in ${language}.

Your goal is to provide a complete picture of the patient's medical history, current conditions, medications, and any other relevant information that would be important for continuity of care.

The report should have the following sections:
1. Patient Information: Basic demographics and contact information
2. Medical History Summary: A concise overview of the patient's significant medical history
3. Current Conditions: Active medical conditions requiring ongoing care
4. Medication List: Current medications with dosages and schedules
5. Recent Visits: Summary of recent medical visits, diagnoses, and treatments
6. Recommendations: Suggested follow-up care and considerations for treatment abroad
7. Travel Considerations: Any medical considerations for travel based on the patient's conditions

Please format your response as a JSON object with the following structure:
{
  "reportTitle": "Medical Travel Report",
  "patientInfo": { ... },
  "medicalHistorySummary": "...",
  "currentConditions": [ ... ],
  "medications": [ ... ],
  "recentVisits": [ ... ],
  "recommendations": "...",
  "travelConsiderations": "..."
}`;
  }
  
  /**
   * Build the user prompt
   * @param {Object} patientData - Prepared patient data
   * @returns {string} - User prompt
   */
  buildUserPrompt(patientData) {
    return `Please generate a medical travel report for the following patient:

Patient Information:
${JSON.stringify(patientData.patient, null, 2)}

Medical Visits (from most recent to oldest):
${JSON.stringify(patientData.visits, null, 2)}

Please analyze this information and create a comprehensive medical travel report that would be suitable for a patient seeking healthcare services abroad. Include all the sections mentioned in your instructions.

Format the response as JSON according to the structure you specified.`;
  }
}

module.exports = new MedicalTravelReportService(); 