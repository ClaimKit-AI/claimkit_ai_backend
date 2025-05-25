const { OpenAI } = require('openai');
const config = require('../../config/config');
const logger = require('../../utils/logger');
const { AppError } = require('../../utils/errorHandler');

class OpenAIService {
  constructor() {
    // Initialize OpenAI client using the API key from config
    if (!config.ai.openai.apiKey || config.ai.openai.apiKey === 'your_openai_api_key') {
      logger.warn('Invalid or missing OpenAI API key - some functionality will be limited');
      this.client = null;
    } else {
      try {
        this.client = new OpenAI({
          apiKey: config.ai.openai.apiKey
        });
        logger.info('OpenAI service initialized');
      } catch (error) {
        logger.error(`Failed to initialize OpenAI client: ${error.message}`);
        this.client = null;
      }
    }
    this.defaultModel = config.ai.openai.model;
  }

  /**
   * Process a template with user input and generate a response from OpenAI
   * @param {Object} template - The template to use for the AI request
   * @param {Object} userInput - The user input data to be processed
   * @returns {Promise<Object>} - The AI-generated response
   */
  async processTemplate(template, userInput) {
    try {
      // Validate user input against template input schema
      this.validateInput(template, userInput);

      // Check if OpenAI client is available
      if (!this.client) {
        throw new AppError('OpenAI service is not properly configured - check API key', 500);
      }

      // Format the prompt with user input data
      const formattedPrompt = this.formatPrompt(template.prompt, userInput);

      // Get model from template or use default
      const model = template.model || this.defaultModel;

      // Prepare OpenAI request parameters
      const parameters = template.parameters || {};

      // Make request to OpenAI
      const response = await this.client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: 'You are an AI healthcare assistant that helps with medical documentation.' },
          { role: 'user', content: formattedPrompt }
        ],
        temperature: parameters.temperature || 0.3,
        max_tokens: parameters.max_tokens || 1024,
        top_p: parameters.top_p || 1,
        frequency_penalty: parameters.frequency_penalty || 0,
        presence_penalty: parameters.presence_penalty || 0,
        response_format: { type: "json_object" }
      });

      // Parse the response and validate against output schema
      const result = this.parseResponse(response, template.outputSchema);
      return result;
    } catch (error) {
      logger.error(`OpenAI service error: ${error.message}`);
      throw new AppError(`Error processing AI request: ${error.message}`, 500);
    }
  }

  /**
   * Validate user input against the template's input schema
   * @param {Object} template - The template containing the input schema
   * @param {Object} userInput - The user input to validate
   */
  validateInput(template, userInput) {
    // Basic input validation - in a production app, use a schema validator like Joi
    const requiredFields = Object.keys(template.inputSchema).filter(
      key => template.inputSchema[key].required
    );

    for (const field of requiredFields) {
      if (!userInput[field]) {
        throw new AppError(`Missing required field: ${field}`, 400);
      }
    }
  }

  /**
   * Format the template prompt by replacing placeholders with user input values
   * @param {string} promptTemplate - The template prompt with placeholders
   * @param {Object} userInput - The user input values
   * @returns {string} - The formatted prompt
   */
  formatPrompt(promptTemplate, userInput) {
    let formattedPrompt = promptTemplate;
    
    // Replace all placeholders in the format {{field}} with user input values
    Object.keys(userInput).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      formattedPrompt = formattedPrompt.replace(placeholder, userInput[key]);
    });
    
    return formattedPrompt;
  }

  /**
   * Parse and validate the OpenAI response
   * @param {Object} response - The raw OpenAI response
   * @param {Object} outputSchema - The expected output schema
   * @returns {Object} - The parsed and validated response
   */
  parseResponse(response, outputSchema) {
    if (!response.choices || response.choices.length === 0) {
      throw new AppError('Invalid response from OpenAI', 500);
    }

    try {
      const content = response.choices[0].message.content;
      
      // Try to find and extract JSON if the response contains other text
      let jsonContent = content;
      
      // If the content has JSON markers, extract just the JSON part
      const jsonStartIndex = content.indexOf('{');
      const jsonEndIndex = content.lastIndexOf('}');
      
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        jsonContent = content.substring(jsonStartIndex, jsonEndIndex + 1);
      }
      
      // For responses with two outputs (like enhancedNote and structuredNote)
      // Try to parse the content directly first
      try {
        return JSON.parse(content);
      } catch (directParseError) {
        // If direct parsing fails, try to extract structured parts
        if (content.includes('"enhancedNote"') && content.includes('"structuredNote"')) {
          // Try to manually construct the JSON if it contains the expected keys
          const enhancedNoteMatch = content.match(/"enhancedNote"\s*:\s*"([^"]*)"/);
          const structuredStartIndex = content.indexOf('"structuredNote"');
          const structuredEndIndex = content.lastIndexOf('}');
          
          if (enhancedNoteMatch && structuredStartIndex !== -1 && structuredEndIndex !== -1) {
            const enhancedNote = enhancedNoteMatch[1];
            const structuredText = content.substring(structuredStartIndex, structuredEndIndex + 1);
            
            return {
              enhancedNote: enhancedNote,
              // Just provide the raw structured text if we can't parse it
              structuredNote: structuredText.replace('"structuredNote":', '')
            };
          }
        }
        
        // Fall back to trying just the extracted JSON
        return JSON.parse(jsonContent);
      }
    } catch (error) {
      logger.error(`JSON parse error: ${error.message}`);
      logger.error(`Response content: ${response.choices[0].message.content.substring(0, 200)}...`);
      throw new AppError(`Failed to parse AI response: ${error.message}`, 500);
    }
  }
}

module.exports = new OpenAIService(); 