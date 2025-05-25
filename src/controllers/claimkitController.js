/**
 * ClaimKit API controller
 * Handles HTTP requests related to ClaimKit API services
 */
const claimkitService = require('../services/claimkit/claimkitService');
const logger = require('../utils/logger');

/**
 * Controller methods for ClaimKit API operations
 */
const claimkitController = {
  /**
   * Review medical documentation for compliance issues
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - JSON response with review results
   */
  async reviewMedicalDocumentation(req, res) {
    try {
      const { 
        doctorNotes, 
        insurancePolicy, 
        generalAgreement, 
        patientHistory,
        modelName,
        temperature,
        maxTokens
      } = req.body;
      
      if (!doctorNotes) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Doctor notes are required' 
        });
      }
      
      const params = {
        doctorNotes,
        insurancePolicy,
        generalAgreement,
        patientHistory
      };
      
      const options = {
        modelName,
        temperature,
        maxTokens
      };
      
      logger.info('Processing review medical documentation request');
      
      const result = await claimkitService.reviewMedicalDocumentation(params, options);
      
      if (result.status === 'error') {
        return res.status(result.code || 500).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error) {
      logger.error(`Error in reviewMedicalDocumentation: ${error.message}`, { stack: error.stack });
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to review medical documentation', 
        error: error.message 
      });
    }
  },
  
  /**
   * Enhance doctor notes with structured information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - JSON response with enhanced notes
   */
  async enhanceDoctorNotes(req, res) {
    try {
      const { 
        doctorNotes, 
        feedback, 
        insurancePolicy, 
        generalAgreement,
        modelName,
        temperature,
        maxTokens,
        template
      } = req.body;
      
      if (!doctorNotes) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Doctor notes are required' 
        });
      }
      
      const params = {
        doctorNotes,
        feedback,
        insurancePolicy,
        generalAgreement
      };
      
      const options = {
        modelName,
        temperature,
        maxTokens,
        template
      };
      
      logger.info('Processing enhance doctor notes request');
      
      const result = await claimkitService.enhanceDoctorNotes(params, options);
      
      if (result.status === 'error') {
        return res.status(result.code || 500).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error) {
      logger.error(`Error in enhanceDoctorNotes: ${error.message}`, { stack: error.stack });
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to enhance doctor notes', 
        error: error.message 
      });
    }
  },
  
  /**
   * Generate an insurance claim from doctor notes
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - JSON response with generated claim
   */
  async generateInsuranceClaim(req, res) {
    try {
      const { 
        enhancedNotes, 
        insurancePolicy, 
        generalAgreement,
        modelName,
        temperature,
        maxTokens,
        template
      } = req.body;
      
      if (!enhancedNotes) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Enhanced notes are required' 
        });
      }
      
      const params = {
        enhancedNotes,
        insurancePolicy,
        generalAgreement
      };
      
      const options = {
        modelName,
        temperature,
        maxTokens,
        template
      };
      
      logger.info('Processing generate insurance claim request');
      
      const result = await claimkitService.generateInsuranceClaim(params, options);
      
      if (result.status === 'error') {
        return res.status(result.code || 500).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error) {
      logger.error(`Error in generateInsuranceClaim: ${error.message}`, { stack: error.stack });
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to generate insurance claim', 
        error: error.message 
      });
    }
  },
  
  /**
   * Handle claim denial by creating corrected claims
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - JSON response with corrected claim
   */
  async handleClaimDenial(req, res) {
    try {
      const { 
        originalNotes, 
        enhancedNotes,
        denialReason, 
        patientHistory, 
        insurancePolicy, 
        generalAgreement,
        modelName,
        maxTokens,
        template
      } = req.body;
      
      if (!originalNotes) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Original notes are required' 
        });
      }
      
      if (!denialReason) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Denial reason is required' 
        });
      }
      
      const params = {
        originalNotes,
        enhancedNotes,
        denialReason,
        patientHistory,
        insurancePolicy,
        generalAgreement
      };
      
      const options = {
        modelName,
        maxTokens,
        template
      };
      
      logger.info('Processing handle claim denial request');
      
      const result = await claimkitService.handleClaimDenial(params, options);
      
      if (result.status === 'error') {
        return res.status(result.code || 500).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error) {
      logger.error(`Error in handleClaimDenial: ${error.message}`, { stack: error.stack });
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to handle claim denial', 
        error: error.message 
      });
    }
  }
};

module.exports = claimkitController; 