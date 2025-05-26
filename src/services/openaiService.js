const OpenAI = require('openai');
const config = require('../config/config');
const logger = require('../utils/logger');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: config.ai.openai.apiKey
});

/**
 * Generate a medical travel report using OpenAI
 * @param {Object} patient - Patient data
 * @param {string} language - Target language
 * @returns {Object} Generated report
 */
const generateTravelReport = async (patient, language) => {
  try {
    // Language mapping for proper names
    const languageNames = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'pt': 'Portuguese',
      'ru': 'Russian'
    };
    
    const languageName = languageNames[language] || language;
    
    // Build system prompt for medical travel report generation with language instructions
    const systemPrompt = `You are a medical professional tasked with creating a medical travel report for a patient.
Generate a comprehensive medical travel report ENTIRELY IN ${languageName} if the language is not English.

The report should include the following sections:
1. Patient Information (use the provided patient data)
2. Medical History (based on the patient's history)
3. Current Conditions
4. Medications
5. Allergies
6. Travel Recommendations (based on medical conditions)
7. Medical Clearance statement

If the selected language is NOT English, also include an "English Translations" section at the end with key medical phrases translated to English.

The report should be professional, accurate, and tailored to the patient's conditions.`;

    // Build user prompt with patient info
    const userPrompt = `Generate a medical travel report for:
Name: ${patient.name}
Age: ${patient.age}
Gender: ${patient.gender}
Medical History: ${patient.medicalHistory.join(', ')}

IMPORTANT: The entire report should be written in ${languageName}${language !== 'en' ? ', NOT in English' : ''}.
Only use English for the optional "English Translations" section if the report is in another language.`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: config.ai.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    // Process the response and structure it for the frontend
    const content = response.choices[0].message.content;
    const reportData = processOpenAIResponse(content, patient, language);
    
    return reportData;
  } catch (error) {
    logger.error(`Error generating travel report with OpenAI: ${error.message}`);
    throw error;
  }
};

/**
 * Process an open-ended query about travel medicine using OpenAI
 * @param {string} query - User's query
 * @param {Object} patient - Patient data (optional)
 * @returns {string} AI response
 */
const processTravelQuery = async (query, patient = null) => {
  try {
    // Build context with patient info if available
    let patientContext = '';
    if (patient) {
      patientContext = `This question is regarding a patient:
Name: ${patient.name}
Age: ${patient.age}
Gender: ${patient.gender}
Medical History: ${patient.medicalHistory.join(', ')}`;
    }

    // Build system prompt
    const systemPrompt = `You are a medical professional specializing in travel medicine. 
Provide accurate, helpful information about medical concerns related to travel.
Keep responses professional, evidence-based, and appropriate for a healthcare setting.
If asked about medications, include appropriate disclaimers about consulting with a physician.`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: config.ai.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...(patientContext ? [{ role: 'user', content: patientContext }] : []),
        { role: 'user', content: query }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content;
  } catch (error) {
    logger.error(`Error processing travel query with OpenAI: ${error.message}`);
    throw error;
  }
};

/**
 * Process the raw OpenAI response into a structured report
 * @param {string} content - Raw response from OpenAI
 * @param {Object} patient - Patient data
 * @param {string} language - Target language
 * @returns {Object} Structured report
 */
function processOpenAIResponse(content, patient, language) {
  // Default structure
  const report = {
    patientInfo: {
      name: patient.name,
      age: patient.age,
      gender: patient.gender
    },
    medicalHistory: patient.medicalHistory || [],
    currentConditions: [],
    medications: [],
    allergies: [],
    travelRecommendations: [],
    medicalClearance: '',
    languageTranslation: {},
    originalContent: content, // Store the complete original content
    language: language,
    disclaimer: 'This report was generated by AI and should be reviewed by a healthcare professional. The information provided is not a substitute for professional medical advice.'
  };

  try {
    // For non-English reports, we need different handling
    if (language !== 'en') {
      // First, try to parse with regex matching common section patterns across languages
      try {
        // Common section pattern: Headers (##, #, or several dashes/equals) or numbered lists (1., 2., etc.)
        const sectionRegex = /(?:\n\s*#+\s*|\n\s*={3,}\s*|\n\s*-{3,}\s*|\n\s*\d+\.\s*|\n\s*\*{3,}\s*)([^\n]+)(?:\n)/g;
        let match;
        let lastSectionStart = 0;
        let sections = [];
        
        // Collect all section headers and their positions
        while ((match = sectionRegex.exec(content)) !== null) {
          const sectionName = match[1].trim();
          const sectionStart = match.index;
          
          // If we've already found a section, add the previous one
          if (lastSectionStart > 0) {
            const previousSectionContent = content.substring(lastSectionStart, sectionStart).trim();
            sections.push({ 
              name: sections[sections.length - 1].name, 
              content: previousSectionContent 
            });
          }
          
          sections.push({ name: sectionName, content: "" });
          lastSectionStart = sectionStart + match[0].length;
        }
        
        // Add the last section
        if (lastSectionStart > 0 && sections.length > 0) {
          const lastSectionContent = content.substring(lastSectionStart).trim();
          sections[sections.length - 1].content = lastSectionContent;
        }
        
        // Process each section based on best guess of section type
        sections.forEach(section => {
          const sectionName = section.name.toLowerCase();
          const sectionContent = section.content;
          
          // Try to determine section type across languages
          if (containsAnyWord(sectionName, ['condition', 'current', 'active', 'estado', 'condición', 'حالة', 'الحالة', 'condition', 'zustand', 'état'])) {
            report.currentConditions = extractListItems(sectionContent);
          } 
          else if (containsAnyWord(sectionName, ['medication', 'medicine', 'drug', 'medicamento', 'دواء', 'أدوية', 'médicament', 'medikament', 'farmaco'])) {
            report.medications = extractListItems(sectionContent);
          } 
          else if (containsAnyWord(sectionName, ['allerg', 'sensitivit', 'alerg', 'حساسية', 'allergie', 'allergi'])) {
            report.allergies = extractListItems(sectionContent);
          } 
          else if (containsAnyWord(sectionName, ['recommendation', 'advice', 'suggest', 'recomend', 'توصيات', 'نصائح', 'empfehlung', 'recommandation', 'consiglio'])) {
            report.travelRecommendations = extractListItems(sectionContent);
          } 
          else if (containsAnyWord(sectionName, ['clearance', 'approval', 'aprobación', 'تصريح', 'موافقة', 'autorisation', 'genehmigung', 'approvazione'])) {
            report.medicalClearance = sectionContent;
          } 
          else if (containsAnyWord(sectionName, ['translation', 'english', 'phrase', 'traducción', 'ترجمة', 'انجليزي', 'traduction', 'übersetzung', 'traduzione'])) {
            // Process translations
            const phrases = extractListItems(sectionContent);
            phrases.forEach(phrase => {
              const parts = phrase.split(':');
              if (parts.length === 2) {
                report.languageTranslation[parts[0].trim()] = parts[1].trim();
              }
            });
          }
          else if (containsAnyWord(sectionName, ['history', 'medical', 'historial', 'تاريخ', 'histoire', 'geschichte', 'storia'])) {
            // We already have medical history from patient data, but we could supplement it
            const additionalHistory = extractListItems(sectionContent);
            if (additionalHistory.length > 0 && !arrayEquals(additionalHistory, report.medicalHistory)) {
              report.medicalHistory = additionalHistory;
            }
          }
        });
      } catch (err) {
        logger.warn(`Error in advanced section parsing for non-English: ${err.message}`);
        // Continue to fallback
      }
      
      // If we have empty critical sections, try standard parsing as fallback
      if (report.currentConditions.length === 0 && report.travelRecommendations.length === 0) {
        parseWithStandardMethod(content, report);
      }
    } else {
      // For English, use the original parsing method
      parseWithStandardMethod(content, report);
    }
    
    return report;
  } catch (error) {
    logger.error(`Error processing OpenAI response: ${error.message}`);
    // Store the raw content as backup in case of parsing failure
    report.rawContent = content;
    return report;
  }
}

/**
 * Use standard method to parse sections (mainly for English)
 * @param {string} content - Content to parse
 * @param {Object} report - Report object to populate
 */
function parseWithStandardMethod(content, report) {
  // Standard method using section headings
  const sections = content.split(/\n\s*#+\s*/);
  
  sections.forEach(section => {
    const lines = section.split('\n');
    const heading = lines[0].trim().toLowerCase();
    const content = lines.slice(1).join('\n').trim();
    
    if (heading.includes('current condition') || heading.includes('active condition')) {
      report.currentConditions = extractListItems(content);
    } else if (heading.includes('medication')) {
      report.medications = extractListItems(content);
    } else if (heading.includes('allerg')) {
      report.allergies = extractListItems(content);
    } else if (heading.includes('recommendation') || heading.includes('travel advice')) {
      report.travelRecommendations = extractListItems(content);
    } else if (heading.includes('clearance') || heading.includes('approval')) {
      report.medicalClearance = content;
    } else if (heading.includes('phrase') || heading.includes('translation') || heading.includes('language')) {
      // Process translations
      const phrases = extractListItems(content);
      phrases.forEach(phrase => {
        const parts = phrase.split(':');
        if (parts.length === 2) {
          report.languageTranslation[parts[0].trim()] = parts[1].trim();
        }
      });
    }
  });
}

/**
 * Check if a string contains any word from an array
 * @param {string} str - String to check
 * @param {Array} words - Array of words to look for
 * @returns {boolean} True if any word is found
 */
function containsAnyWord(str, words) {
  return words.some(word => str.includes(word));
}

/**
 * Compare two arrays for equality
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {boolean} True if arrays have same elements
 */
function arrayEquals(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

/**
 * Extract list items from a text block
 * @param {string} text - Text containing list items
 * @returns {Array} Array of list items
 */
function extractListItems(text) {
  const lines = text.split('\n');
  return lines
    .map(line => line.replace(/^[-*•]\s*/, '').trim())
    .filter(line => line.length > 0);
}

module.exports = {
  generateTravelReport,
  processTravelQuery
}; 