const openAIService = require('./openaiService');
const logger = require('../../utils/logger');
const { AppError } = require('../../utils/errorHandler');

/**
 * AI Service Factory - returns the appropriate AI service based on provider
 */
class AIService {
  constructor() {
    this.services = {
      openai: openAIService,
      // gemini: null, // Will be implemented later
      // deepseek: null, // Will be implemented later
    };
    logger.info('AI Service factory initialized');
  }

  /**
   * Get the appropriate AI service based on provider
   * @param {string} provider - The AI provider (openai, gemini, deepseek)
   * @returns {Object} - The appropriate AI service
   */
  getService(provider) {
    if (!provider) {
      throw new AppError('AI provider is required', 400);
    }

    const service = this.services[provider.toLowerCase()];
    if (!service) {
      throw new AppError(`Unsupported AI provider: ${provider}`, 400);
    }

    return service;
  }

  /**
   * Process a template with user input using the appropriate AI service
   * @param {Object} template - The template to process
   * @param {Object} userInput - The user input data
   * @returns {Promise<Object>} - The AI-generated response
   */
  async processTemplate(template, userInput) {
    const service = this.getService(template.provider);
    return await service.processTemplate(template, userInput);
  }
}

module.exports = new AIService(); 