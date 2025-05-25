/**
 * ClaimKit API Service
 * Handles interactions with the ClaimKit AI Service API
 */
const axios = require('axios');
const logger = require('../../utils/logger');
const config = require('../../config/config');

// Base configuration for ClaimKit API
const CLAIMKIT_API_BASE_URL = config.ai.claimkit.baseUrl;
const DEFAULT_TIMEOUT = config.ai.claimkit.timeout;
const MAX_RETRIES = config.ai.claimkit.maxRetries;
const DEFAULT_MODEL = config.ai.claimkit.defaultModel;

/**
 * Create configured axios instance for ClaimKit API
 */
const claimkitApi = axios.create({
  baseURL: CLAIMKIT_API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Make API request with retry logic for transient failures
 * @param {Function} apiCall - Function that returns a promise for the API call
 * @param {Number} maxRetries - Maximum number of retry attempts
 * @param {Number} retryCount - Current retry count (used internally)
 * @returns {Promise} - API response
 */
async function makeRequestWithRetry(apiCall, maxRetries = MAX_RETRIES, retryCount = 0) {
  try {
    return await apiCall();
  } catch (error) {
    // Don't retry if it's a client error (4xx)
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      throw error;
    }

    // Retry if we haven't exceeded max retries
    if (retryCount < maxRetries) {
      // Exponential backoff: 2^retry * 1000ms + random jitter
      const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
      logger.warn(`ClaimKit API request failed, retrying in ${Math.round(delay)}ms (${retryCount + 1}/${maxRetries})`);
      
      // Wait for the backoff period
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Recursive call with incremented retry count
      return makeRequestWithRetry(apiCall, maxRetries, retryCount + 1);
    }
    
    // We've exhausted retries, rethrow the error
    logger.error(`ClaimKit API request failed after ${maxRetries} retries: ${error.message}`);
    throw error;
  }
}

/**
 * Process error from API response for consistent error handling
 * @param {Error} error - Error object from API call
 * @returns {Object} - Standardized error object
 */
function processApiError(error) {
  if (error.response) {
    // The server responded with a status code outside of 2xx
    logger.error(`ClaimKit API error: ${error.response.status}`, {
      data: error.response.data,
      status: error.response.status
    });
    
    return {
      status: 'error',
      code: error.response.status,
      message: error.response.data?.message || 'Error from ClaimKit API',
      details: error.response.data
    };
  } else if (error.request) {
    // The request was made but no response was received
    logger.error('ClaimKit API no response received', { request: error.request });
    
    return {
      status: 'error',
      code: 'NETWORK_ERROR',
      message: 'No response received from ClaimKit API. Please check network connection.',
      details: { request: JSON.stringify(error.request) }
    };
  } else {
    // Something happened in setting up the request
    logger.error(`ClaimKit API request setup error: ${error.message}`);
    
    return {
      status: 'error',
      code: 'REQUEST_SETUP_ERROR',
      message: `Error setting up request: ${error.message}`,
      details: { error: error.stack }
    };
  }
}

/**
 * ClaimKit service methods
 */
const claimkitService = {
  /**
   * Review medical documentation for compliance issues
   * @param {Object} params - Parameters for review
   * @param {String} params.doctorNotes - Doctor's clinical notes
   * @param {String} params.insurancePolicy - Insurance policy details
   * @param {String} params.generalAgreement - General agreement text
   * @param {String} params.patientHistory - Patient history notes
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Review results
   */
  async reviewMedicalDocumentation(params, options = {}) {
    const { 
      doctorNotes, 
      insurancePolicy = '', 
      generalAgreement = '', 
      patientHistory = '' 
    } = params;
    
    const {
      modelName = DEFAULT_MODEL,
      temperature = 0.3,
      maxTokens = 16000
    } = options;
    
    if (!doctorNotes) {
      throw new Error('Doctor notes are required for review');
    }
    
    logger.info('Sending doctor notes for ClaimKit review');
    
    try {
      const apiCall = () => claimkitApi.post('/claimkit/insurance_claim_review/history', {
        claim: {
          doctor_notes: doctorNotes,
          general_agreement: generalAgreement,
          insurance_policy_details: insurancePolicy,
          claimkit_review_rules_id: "doctornotes_review_criteria",
          history: patientHistory
        },
        model_name: modelName,
        temperature: temperature,
        max_tokens: maxTokens
      });
      
      const response = await makeRequestWithRetry(apiCall);
      logger.info('Received ClaimKit review response');
      
      return {
        status: 'success',
        data: response.data
      };
    } catch (error) {
      return processApiError(error);
    }
  },
  
  /**
   * Enhance doctor notes with structured information
   * @param {Object} params - Parameters for enhancement
   * @param {String} params.doctorNotes - Original doctor notes
   * @param {String} params.feedback - Optional feedback from review
   * @param {String} params.insurancePolicy - Insurance policy details
   * @param {String} params.generalAgreement - General agreement text
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Enhanced notes
   */
  async enhanceDoctorNotes(params, options = {}) {
    const { 
      doctorNotes, 
      feedback = '', 
      insurancePolicy = '', 
      generalAgreement = '' 
    } = params;
    
    const {
      modelName = DEFAULT_MODEL,
      temperature = 0.4,
      maxTokens = 16000,
      template = "doctor_notes_template_no_codes"
    } = options;
    
    if (!doctorNotes) {
      throw new Error('Doctor notes are required for enhancement');
    }
    
    logger.info('Sending doctor notes for ClaimKit enhancement');
    
    try {
      const apiCall = () => claimkitApi.post('/claimkit/doctor_notes/improve', {
        initial_claim: doctorNotes,
        feedback: feedback,
        patient_insurance_policy: insurancePolicy,
        insurance_general_agreement: generalAgreement,
        doctor_note_template: template,
        model_name: modelName,
        temperature: temperature,
        max_tokens: maxTokens
      });
      
      const response = await makeRequestWithRetry(apiCall);
      logger.info('Received ClaimKit enhancement response');
      
      return {
        status: 'success',
        data: response.data
      };
    } catch (error) {
      return processApiError(error);
    }
  },
  
  /**
   * Generate an insurance claim from doctor notes
   * @param {Object} params - Parameters for claim generation
   * @param {String} params.enhancedNotes - Enhanced doctor notes
   * @param {String} params.insurancePolicy - Insurance policy details
   * @param {String} params.generalAgreement - General agreement text
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Generated claim
   */
  async generateInsuranceClaim(params, options = {}) {
    const { 
      enhancedNotes, 
      insurancePolicy = '', 
      generalAgreement = '' 
    } = params;
    
    const {
      modelName = DEFAULT_MODEL,
      temperature = 0.3,
      maxTokens = 16000,
      template = "insurance_claim_template"
    } = options;
    
    if (!enhancedNotes) {
      throw new Error('Enhanced notes are required for claim generation');
    }
    
    logger.info('Sending enhanced notes for ClaimKit claim generation');
    
    try {
      const apiCall = () => claimkitApi.post('/claimkit/insurance_claim/write', {
        enhanced_notes: enhancedNotes,
        patient_insurance_policy: insurancePolicy,
        insurance_general_agreement: generalAgreement,
        insurance_claim_template: template,
        model_name: modelName,
        temperature: temperature,
        max_tokens: maxTokens
      });
      
      const response = await makeRequestWithRetry(apiCall);
      logger.info('Received ClaimKit claim generation response');
      
      return {
        status: 'success',
        data: response.data
      };
    } catch (error) {
      return processApiError(error);
    }
  },
  
  /**
   * Handle claim denial by creating corrected claims
   * @param {Object} params - Parameters for denial management
   * @param {String} params.originalNotes - Original doctor notes
   * @param {String} params.enhancedNotes - Enhanced doctor notes
   * @param {String} params.denialReason - Reason for claim denial
   * @param {String} params.patientHistory - Patient history notes
   * @param {String} params.insurancePolicy - Insurance policy details
   * @param {String} params.generalAgreement - General agreement text
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Corrected claim
   */
  async handleClaimDenial(params, options = {}) {
    const { 
      originalNotes, 
      enhancedNotes = '',
      denialReason, 
      patientHistory = '', 
      insurancePolicy = '', 
      generalAgreement = '' 
    } = params;
    
    const {
      modelName = DEFAULT_MODEL,
      maxTokens = 16000,
      template = "denial_management"
    } = options;
    
    if (!originalNotes) {
      throw new Error('Original notes are required for denial management');
    }
    
    if (!denialReason) {
      throw new Error('Denial reason is required for denial management');
    }
    
    logger.info('Sending denial information for ClaimKit correction');
    
    try {
      const apiCall = () => claimkitApi.post('/claimkit/claim/denial_management', {
        original_claim: originalNotes,
        denial_reason: denialReason,
        enhanced_doctor_notes: enhancedNotes || originalNotes,
        patient_history: patientHistory,
        patient_insurance_policy: insurancePolicy,
        insurance_general_agreement: generalAgreement,
        template_id: template,
        model: modelName,
        max_tokens: maxTokens
      });
      
      const response = await makeRequestWithRetry(apiCall);
      logger.info('Received ClaimKit denial management response');
      
      return {
        status: 'success',
        data: response.data
      };
    } catch (error) {
      return processApiError(error);
    }
  }
};

module.exports = claimkitService; 