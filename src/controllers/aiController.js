const aiService = require('../services/ai/aiService');
const Template = require('../models/Template');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const config = require('../config/config');
const fs = require('fs');

/**
 * Process input data using a template and AI service
 */
exports.processWithTemplate = async (req, res, next) => {
  try {
    const { templateId } = req.params;
    const inputData = req.body;
    
    // Get template from database
    const template = await Template.findById(templateId);
    
    if (!template) {
      return next(new AppError('Template not found', 404));
    }
    
    if (!template.isActive) {
      return next(new AppError('This template is no longer active', 400));
    }
    
    // Process the template with input data using AI service
    const result = await aiService.processTemplate(template, inputData);
    
    // Return result
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`Error processing template: ${error.message}`);
    next(new AppError(`Failed to process AI request: ${error.message}`, 500));
  }
};

/**
 * Process doctor notes review specifically
 */
exports.reviewDoctorNotes = async (req, res, next) => {
  try {
    const { notes, patientAge, patientGender, visitType, insurancePolicy } = req.body;
    
    // Validate required input
    if (!notes) {
      return next(new AppError('Doctor notes are required', 400));
    }
    
    if (!patientAge) {
      return next(new AppError('Patient age is required', 400));
    }
    
    if (!patientGender) {
      return next(new AppError('Patient gender is required', 400));
    }
    
    if (!visitType) {
      return next(new AppError('Visit type is required', 400));
    }
    
    // Check if we're using a real API key or if we should return mock data
    if (config.ai.openai.apiKey === undefined || config.ai.openai.apiKey === '') {
      logger.warn('Using mock data: No valid OpenAI API key provided');
      return res.status(200).json({
        status: 'success',
        mock: true,
        data: generateMockReviewResponse(notes, patientAge, patientGender, visitType)
      });
    }
    
    // Find the doctor notes review template
    const template = await Template.findOne({ 
      serviceType: 'doctor_notes_review',
      isActive: true
    });
    
    if (!template) {
      return next(new AppError('Doctor notes review template not found', 404));
    }
    
    // Process the template
    const result = await aiService.processTemplate(template, {
      notes, 
      patientAge, 
      patientGender, 
      visitType,
      insurancePolicy: insurancePolicy || 'No insurance information provided'
    });
    
    // Return result
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`Error reviewing doctor notes: ${error.message}`);
    next(new AppError(`Failed to review doctor notes: ${error.message}`, 500));
  }
};

/**
 * Process with custom input and a specific AI provider
 */
exports.processWithProvider = async (req, res, next) => {
  try {
    const { provider, serviceType } = req.params;
    const inputData = req.body;
    
    // Find an appropriate template for the requested service type and provider
    const template = await Template.findOne({ 
      serviceType,
      provider,
      isActive: true
    });
    
    if (!template) {
      return next(new AppError(`No active template found for ${serviceType} using ${provider}`, 404));
    }
    
    // Process the template
    const result = await aiService.processTemplate(template, inputData);
    
    // Return result
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`Error processing with provider: ${error.message}`);
    next(new AppError(`Failed to process with provider: ${error.message}`, 500));
  }
};

/**
 * Process doctor notes enhancement specifically
 * Uses a multi-step approach for complex documents
 */
exports.enhanceDoctorNotes = async (req, res, next) => {
  try {
    // Input validation
    const { notes, patientAge, patientGender, visitType, reviewFeedback, insurancePolicy } = req.body;

    if (!notes) {
      return next(new AppError('Notes are required', 400));
    }

    if (!patientAge || !patientGender || !visitType) {
      return next(new AppError('Patient age, gender, and visit type are required', 400));
    }

    // Get template
    const template = getDoctorNotesEnhancementTemplate();

    // Use hardcoded API key instead of checking environment variables
    const useMockData = false; // Set to false to use the real API with our hardcoded key
    
    if (useMockData) {
      logger.warn('Using mock data for doctor notes enhancement due to testing flag');
      return res.status(200).json({
        status: 'success',
        message: 'Using mock data (testing flag enabled)',
        data: getMockEnhancedDoctorNotes()
      });
    }
    
    // Process the enhancement in multiple steps to avoid token limits
    const enhancementResult = await processComplexEnhancement(
      template, 
      notes, 
      patientAge, 
      patientGender, 
      visitType, 
      reviewFeedback,
      insurancePolicy
    );
    
    return res.status(200).json({
      status: 'success',
      data: enhancementResult
    });
  } catch (error) {
    logger.error(`Error enhancing doctor notes: ${error.message}`);
    return next(new AppError(`Failed to enhance doctor notes: ${error.message}`, 500));
  }
};

/**
 * Process a complex enhancement in multiple steps to avoid token limits
 * Specialized for MENA region healthcare documentation standards
 * @param {Object} template - The enhancement template
 * @param {string} notes - The original doctor notes
 * @param {number} patientAge - Patient age
 * @param {string} patientGender - Patient gender
 * @param {string} visitType - Visit type
 * @param {string} reviewFeedback - Review feedback
 * @param {string} insurancePolicy - Insurance policy details
 * @returns {Object} - The complete enhanced result
 */
async function processComplexEnhancement(template, notes, patientAge, patientGender, visitType, reviewFeedback, insurancePolicy = '') {
  try {
    // Use the hardcoded API key instead of environment variables
    const apiKey = process.env.OPENAI_API_KEY || config.ai.openai.apiKey;
    
    // Initialize OpenAI client directly
    const { OpenAI } = require('openai');
    const openai = new OpenAI({
      apiKey: apiKey
    });
    
    logger.info('Using direct OpenAI client with provided API key');
    
    // STEP 1: Generate the assessments and medical coding
    logger.info('Step 1: Generating medical coding and assessments...');
    const codingPrompt = `
You are an expert in healthcare coding with deep knowledge of ICD-10-CM and CPT codes.
Focus ONLY on extracting diagnoses with ICD codes and procedures with CPT codes from these notes.

Original Notes: ${notes}

Patient: ${patientAge}-year-old ${patientGender}, ${visitType}

${reviewFeedback ? `Review Feedback: ${reviewFeedback}` : ''}
${insurancePolicy ? `Insurance Policy: ${insurancePolicy}` : ''}

Based on British Medical Journal guidelines and 2021 APCC ICD-10-CM standards, identify:
1. Primary diagnosis with ICD-10 code
2. Secondary diagnosis with ICD-10 code (must provide one, even if not in original notes)
3. All procedures with CPT codes
4. Medication details

IMPORTANT: Do not just recommend changes - implement them by providing the correct codes and details.

Return ONLY a JSON object with these exact fields:
{
  "assessments": [
    {
      "primary_diagnosis": "...",
      "primary_diagnosis_code": "...",
      "clinicalEvidence": "...",
      "isConsistent": true/false
    },
    {
      "secondary_diagnosis": "...",
      "secondary_diagnosis_code": "...",
      "clinicalEvidence": "...",
      "justification": "..."
    }
  ],
  "plan": [
    {
      "procedure": "...",
      "cptCode": "...",
      "medicalNecessity": "...",
      "isConsistent": true/false
    }
  ],
  "medications": [
    {
      "name": "...",
      "dosage": "...",
      "frequency": "...",
      "rationale": "...",
      "isConsistent": true/false
    }
  ]
}
`;

    const codingResponse = await openai.chat.completions.create({
      model: template.model,
      messages: [
        { role: 'system', content: 'You are a medical coding specialist for the MENA region who returns only valid JSON.' },
        { role: 'user', content: codingPrompt }
      ],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const codingResult = JSON.parse(codingResponse.choices[0].message.content);
    
    // STEP 2: Generate the clinical documentation sections
    logger.info('Step 2: Generating enhanced clinical narrative...');
    const clinicalPrompt = `
You are a medical documentation specialist for the MENA region. Enhance these clinical notes with more complete information.
Focus on creating well-structured clinical narratives following British Medical Journal standards.

Original Notes: ${notes}

Patient: ${patientAge}-year-old ${patientGender}, ${visitType}

${reviewFeedback ? `Review Feedback: ${reviewFeedback}` : ''}
${insurancePolicy ? `Insurance Policy: ${insurancePolicy}` : ''}

IMPORTANT: Do not just recommend changes - implement them by providing a complete, enhanced version of the clinical documentation.

Return ONLY a JSON object with these exact fields:
{
  "chiefComplaint": "...",
  "historyOfPresentIllness": "...",
  "pastMedicalHistory": "...",
  "allergies": [...],
  "vitalSigns": {
    "bloodPressure": "...",
    "heartRate": "...",
    "respiratoryRate": "...",
    "temperature": "...",
    "height": "...",
    "weight": "...",
    "bmi": "..."
  },
  "reviewOfSystems": {...},
  "physicalExamination": {...},
  "followUp": "..."
}
`;

    const clinicalResponse = await openai.chat.completions.create({
      model: template.model,
      messages: [
        { role: 'system', content: 'You are a medical documentation specialist who follows MENA region standards and returns only valid JSON.' },
        { role: 'user', content: clinicalPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const clinicalResult = JSON.parse(clinicalResponse.choices[0].message.content);
    
    // STEP 3: Generate a narrative format that includes all the enhanced content with codes
    logger.info('Step 3: Generating comprehensive narrative with codes...');
    const narrativePrompt = `
You are a healthcare documentation specialist for the MENA region. Create a comprehensive, enhanced version of the following medical note.
Incorporate ALL relevant ICD-10 and CPT codes directly into the narrative format.

Original Notes: ${notes}

Patient Information:
- Age: ${patientAge}
- Gender: ${patientGender}
- Visit Type: ${visitType}
${insurancePolicy ? `- Insurance Policy: ${insurancePolicy}` : ''}

${reviewFeedback ? `Review Feedback: ${reviewFeedback}` : ''}

Clinical Data:
- Chief Complaint: ${clinicalResult.chiefComplaint}
- HPI: ${clinicalResult.historyOfPresentIllness}
- PMH: ${clinicalResult.pastMedicalHistory}
- Allergies: ${JSON.stringify(clinicalResult.allergies)}
- Vital Signs: ${JSON.stringify(clinicalResult.vitalSigns)}
- Review of Systems: ${JSON.stringify(clinicalResult.reviewOfSystems)}
- Physical Examination: ${JSON.stringify(clinicalResult.physicalExamination)}

Assessments:
${JSON.stringify(codingResult.assessments)}

Plan:
${JSON.stringify(codingResult.plan)}

Medications:
${JSON.stringify(codingResult.medications)}

Follow-up:
${clinicalResult.followUp}

INSTRUCTIONS:
1. Create a complete, properly formatted medical note that follows MENA region documentation standards.
2. Embed all ICD-10 and CPT codes directly in the narrative (e.g., "Hypertension (I10)").
3. Include justification for all diagnoses, procedures, and medications.
4. Incorporate all feedback and address any issues mentioned in the review.
5. Format the note as a single cohesive document with clear section headings.
6. Make sure the narrative text implements all the improvements, not just recommends them.

Return ONLY the enhanced narrative note as a single text string.
`;

    const narrativeResponse = await openai.chat.completions.create({
      model: template.model,
      messages: [
        { role: 'system', content: 'You are a healthcare documentation specialist who creates complete, enhanced medical notes.' },
        { role: 'user', content: narrativePrompt }
      ],
      temperature: 0.3,
      max_tokens: 2500
    });

    const narrativeNote = narrativeResponse.choices[0].message.content;
    
    // STEP 4: Analyze gaps and inconsistencies
    logger.info('Step 4: Analyzing implemented changes...');
    const analysisPrompt = `
You are an insurance documentation specialist for the MENA region. Analyze the original notes and the enhanced version.
Focus on identifying what specific changes were made to improve documentation quality and insurance compliance.

Original Notes: ${notes}

Patient: ${patientAge}-year-old ${patientGender}, ${visitType}

${reviewFeedback ? `Review Feedback: ${reviewFeedback}` : ''}
${insurancePolicy ? `Insurance Policy: ${insurancePolicy}` : ''}

Changes Implemented:
- Added diagnoses with proper ICD-10 codes
- Added procedures with proper CPT codes
- Enhanced clinical documentation
- Improved structure and organization

Return ONLY a JSON object with these exact fields:
{
  "inconsistenciesFound": ["..."],
  "gapsResolved": ["..."],
  "enhancementsImplemented": ["..."]
}
`;

    const analysisResponse = await openai.chat.completions.create({
      model: template.model,
      messages: [
        { role: 'system', content: 'You are a healthcare documentation compliance specialist who returns only valid JSON.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const analysisResult = JSON.parse(analysisResponse.choices[0].message.content);
    
    // Combine all results into the final enhanced document
    const combinedResult = {
      enhancedNote: {
        ...clinicalResult,
        ...codingResult
      },
      formattedNote: narrativeNote,
      inconsistenciesFound: analysisResult.inconsistenciesFound,
      gapsResolved: analysisResult.gapsResolved,
      enhancementsImplemented: analysisResult.enhancementsImplemented
    };
    
    logger.info('Enhancement complete - successfully processed in chunks');
    return combinedResult;
  } catch (error) {
    logger.error(`Error in MENA healthcare documentation processing: ${error.message}`);
    throw new AppError(`Error in MENA healthcare documentation process: ${error.message}`, 500);
  }
}

/**
 * Generate a mock response for doctor notes review
 * Used when no valid API key is available
 */
function generateMockReviewResponse(notes, patientAge, patientGender, visitType) {
  return {
    "overallRating": 7,
    "completeness": {
      "score": 8,
      "feedback": "The documentation contains most necessary components including chief complaint, history, examination, assessment, and plan. Good structure overall.",
      "missingElements": ["More detailed family history", "Vital signs details"]
    },
    "diagnosisProcedureRelevance": {
      "score": 8,
      "feedback": "The diagnosis of tension headaches has appropriate relevance to the recommended procedures."
    },
    "procedureMedicationRelevance": {
      "score": 9,
      "feedback": "The prescribed sumatriptan is highly relevant to the procedure of treating tension headaches."
    },
    "diagnosisMedicationRelevance": {
      "score": 9,
      "feedback": "The tension headache diagnosis strongly supports the prescription of sumatriptan."
    },
    "historyMedicationConsistency": {
      "score": 7,
      "feedback": "There is reasonable consistency between previous medication (ibuprofen) and current prescription (sumatriptan).",
      "contradictions": []
    },
    "historyProcedureConsistency": {
      "score": 7,
      "feedback": "Previous self-medication with ibuprofen aligns with the current treatment approach.",
      "contradictions": []
    },
    "medicalNecessity": {
      "score": 7,
      "feedback": "The documentation provides adequate justification for the proposed treatments and services.",
      "improvementSuggestions": ["Include more details on previous treatment attempts", "Document impact on daily activities"]
    },
    "insuranceCoverage": {
      "score": 6,
      "feedback": "Limited insurance information makes coverage assessment difficult.",
      "coverageIssues": ["Insufficient insurance policy details", "Some treatments may require prior authorization"]
    },
    "specificity": {
      "score": 6,
      "feedback": "Some areas need more specific information to better support the diagnosis and treatment plan.",
      "areasNeedingSpecificity": ["Pain scale methodology", "Medication dosage details", "Duration of symptoms"]
    },
    "consistency": {
      "score": 9,
      "feedback": "The documentation is internally consistent with no significant contradictions.",
      "contradictions": []
    },
    "complianceWithStandards": {
      "score": 7,
      "feedback": "The documentation generally follows healthcare documentation standards but has minor areas for improvement.",
      "complianceIssues": ["Missing date/time stamps", "Abbreviations used without prior definition"]
    },
    "recommendations": [
      "Include complete vital signs",
      "Add more specificity to medication dosages and schedules",
      "Document impact of condition on patient's daily activities",
      "Include relevant negatives in the review of systems"
    ]
  };
}

/**
 * Generate a mock data for enhanced doctor notes that matches the new schema
 * Used when no valid API key is available for testing
 * @returns {Object} Mock enhanced doctor notes
 */
function getMockEnhancedDoctorNotes() {
  return {
    enhancedNote: {
      chiefComplaint: "Persistent abdominal pain and fatigue for the past 2 weeks",
      historyOfPresentIllness: "Patient presents with a 2-week history of intermittent abdominal pain localized to the right upper quadrant. Pain is described as dull and aching, rated 5/10 in severity, worsening after meals. Associated symptoms include fatigue, mild nausea without vomiting, and decreased appetite. No fever, chills, or jaundice reported. Patient denies changes in bowel habits or urinary symptoms.",
      pastMedicalHistory: "Hypertension diagnosed 5 years ago, well-controlled on medication. Cholecystectomy 3 years ago. Type 2 diabetes mellitus diagnosed 7 years ago with good glycemic control. No known drug allergies.",
      allergies: ["No known drug allergies", "Seasonal pollen (mild)"],
      vitalSigns: {
        bloodPressure: "138/82 mmHg",
        heartRate: "78 bpm",
        respiratoryRate: "16 breaths per minute",
        temperature: "37.1°C",
        height: "172 cm",
        weight: "84 kg",
        bmi: "28.4"
      },
      reviewOfSystems: {
        constitutional: "Reports fatigue but denies fever, weight loss, or night sweats",
        cardiovascular: "Denies chest pain, palpitations, or shortness of breath",
        respiratory: "Denies cough, wheezing, or dyspnea",
        gastrointestinal: "Reports right upper quadrant abdominal pain and mild nausea. Denies vomiting, diarrhea, or constipation",
        genitourinary: "Denies dysuria, frequency, or hematuria",
        musculoskeletal: "Denies joint pain or stiffness",
        neurological: "Denies headaches, dizziness, or sensory changes",
        psychiatric: "Denies anxiety or depression"
      },
      physicalExamination: {
        general: "Alert and oriented, appears comfortable at rest",
        cardiovascular: "Regular rate and rhythm, no murmurs, gallops, or rubs",
        respiratory: "Clear to auscultation bilaterally, no wheezes, rales, or rhonchi",
        abdominal: "Soft, non-distended, tender to palpation in the right upper quadrant, no rebound tenderness, negative Murphy's sign, no hepatosplenomegaly",
        extremities: "No edema, good peripheral pulses",
        skin: "No jaundice, rashes, or lesions"
      },
      assessments: [
        {
          "primary_diagnosis": "Nonalcoholic Fatty Liver Disease",
          "primary_diagnosis_code": "K76.0",
          "clinicalEvidence": "Right upper quadrant pain, elevated liver enzymes, history of metabolic risk factors (diabetes, elevated BMI)",
          "isConsistent": true
        },
        {
          "secondary_diagnosis": "Type 2 Diabetes Mellitus, without complications",
          "secondary_diagnosis_code": "E11.9",
          "clinicalEvidence": "7-year history of diabetes with good glycemic control",
          "justification": "Important comorbidity that contributes to the primary diagnosis and requires ongoing management"
        }
      ],
      plan: [
        {
          "procedure": "Comprehensive Metabolic Panel",
          "cptCode": "80053",
          "medicalNecessity": "To evaluate liver function and metabolic status",
          "isConsistent": true
        },
        {
          "procedure": "Abdominal Ultrasound",
          "cptCode": "76700",
          "medicalNecessity": "To assess liver morphology and rule out other causes of right upper quadrant pain",
          "isConsistent": true
        }
      ],
      medications: [
        {
          "name": "Metformin",
          "dosage": "1000mg",
          "frequency": "twice daily",
          "rationale": "For glycemic control in Type 2 Diabetes",
          "isConsistent": true
        },
        {
          "name": "Lisinopril",
          "dosage": "10mg",
          "frequency": "once daily",
          "rationale": "For hypertension management",
          "isConsistent": true
        }
      ],
      followUp: "Follow up in 2 weeks after completion of ultrasound and laboratory studies. Recommend dietary consultation for NAFLD management."
    },
    formattedNote: `
MEDICAL NOTE

PATIENT INFORMATION:
45-year-old male, initial consultation

CHIEF COMPLAINT:
Persistent abdominal pain and fatigue for the past 2 weeks

HISTORY OF PRESENT ILLNESS:
Patient presents with a 2-week history of intermittent abdominal pain localized to the right upper quadrant. Pain is described as dull and aching, rated 5/10 in severity, worsening after meals. Associated symptoms include fatigue, mild nausea without vomiting, and decreased appetite. No fever, chills, or jaundice reported. Patient denies changes in bowel habits or urinary symptoms.

PAST MEDICAL HISTORY:
- Hypertension (I10) diagnosed 5 years ago, well-controlled on medication
- Cholecystectomy 3 years ago
- Type 2 diabetes mellitus (E11.9) diagnosed 7 years ago with good glycemic control

ALLERGIES:
- No known drug allergies
- Seasonal pollen (mild)

VITAL SIGNS:
- Blood Pressure: 138/82 mmHg
- Heart Rate: 78 bpm
- Respiratory Rate: 16 breaths per minute
- Temperature: 37.1°C
- Height: 172 cm
- Weight: 84 kg
- BMI: 28.4 (indicating overweight status)

REVIEW OF SYSTEMS:
- Constitutional: Reports fatigue but denies fever, weight loss, or night sweats
- Cardiovascular: Denies chest pain, palpitations, or shortness of breath
- Respiratory: Denies cough, wheezing, or dyspnea
- Gastrointestinal: Reports right upper quadrant abdominal pain and mild nausea. Denies vomiting, diarrhea, or constipation
- Genitourinary: Denies dysuria, frequency, or hematuria
- Musculoskeletal: Denies joint pain or stiffness
- Neurological: Denies headaches, dizziness, or sensory changes
- Psychiatric: Denies anxiety or depression

PHYSICAL EXAMINATION:
- General: Alert and oriented, appears comfortable at rest
- Cardiovascular: Regular rate and rhythm, no murmurs, gallops, or rubs
- Respiratory: Clear to auscultation bilaterally, no wheezes, rales, or rhonchi
- Abdominal: Soft, non-distended, tender to palpation in the right upper quadrant, no rebound tenderness, negative Murphy's sign, no hepatosplenomegaly
- Extremities: No edema, good peripheral pulses
- Skin: No jaundice, rashes, or lesions

ASSESSMENT:
1. Primary: Nonalcoholic Fatty Liver Disease (K76.0)
   Clinical Evidence: Right upper quadrant pain, elevated liver enzymes, history of metabolic risk factors (diabetes, elevated BMI)

2. Secondary: Type 2 Diabetes Mellitus, without complications (E11.9)
   Clinical Evidence: 7-year history of diabetes with good glycemic control
   Justification: Important comorbidity that contributes to the primary diagnosis and requires ongoing management

PLAN:
1. Comprehensive Metabolic Panel (CPT: 80053)
   Medical Necessity: To evaluate liver function and metabolic status

2. Abdominal Ultrasound (CPT: 76700)
   Medical Necessity: To assess liver morphology and rule out other causes of right upper quadrant pain

MEDICATIONS:
1. Metformin 1000mg twice daily
   Rationale: For glycemic control in Type 2 Diabetes

2. Lisinopril 10mg once daily
   Rationale: For hypertension management

FOLLOW-UP:
Follow up in 2 weeks after completion of ultrasound and laboratory studies. Recommend dietary consultation for NAFLD management.
`,
    inconsistenciesFound: [
      "Original note lacked specific timing information for abdominal pain onset",
      "Original vital signs were incomplete, missing respiratory rate and BMI calculation",
      "No specific review of cardiovascular system despite hypertension history"
    ],
    gapsResolved: [
      "Added comprehensive review of systems for insurance documentation requirements",
      "Included secondary diagnosis to ensure proper comorbidity documentation",
      "Added specific follow-up timeline and recommendations for continuity of care"
    ],
    enhancementsImplemented: [
      "Embedded ICD-10 codes for all diagnoses (K76.0, E11.9, I10)",
      "Added CPT codes for all procedures (80053, 76700)",
      "Standardized medication dosing format with rationale",
      "Formatted vital signs per MENA region documentation standards"
    ]
  };
}

/**
 * Get the doctor notes enhancement template
 * @returns {Object} The template object with provider and model info
 */
function getDoctorNotesEnhancementTemplate() {
  const template = require('../templates/doctorNotesEnhancement');
  return template;
}

/**
 * Transcribe audio using OpenAI API with modern approach
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.transcribeAudio = async (req, res, next) => {
  try {
    // Check if file exists
    if (!req.file) {
      logger.error('No audio file provided in request');
      return next(new AppError('No audio file provided', 400));
    }

    logger.info(`Audio file received: ${req.file.originalname}, size: ${req.file.size} bytes, mime type: ${req.file.mimetype}`);

    // Get file path
    const filePath = req.file.path;
    logger.info(`File saved to: ${filePath}`);
    
    // For testing purposes only - set to false to use the API
    const useMockData = false;
    
    // Use this hardcoded API key for testing
    const apiKey = process.env.OPENAI_API_KEY || config.ai.openai.apiKey;

    if (useMockData) {
      logger.warn('Using mock transcription - for testing');
      
      // Delete the file if it exists
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        logger.error(`Error deleting file: ${err.message}`);
      }
      
      return res.status(200).json({
        status: 'success',
        message: 'Using mock data for testing',
        data: {
          text: "Patient is a 45-year-old male presenting with abdominal pain for 2 weeks. Pain is localized to right upper quadrant and gets worse after meals. Patient reports fatigue and mild nausea. Medical history includes hypertension and type 2 diabetes, both well-controlled with medication. Physical exam shows tenderness in right upper quadrant but no rebound. No jaundice observed. Patient denies fever or chills."
        }
      });
    }
    
    // Check file exists and has content
    if (!fs.existsSync(filePath)) {
      logger.error(`File does not exist at path: ${filePath}`);
      return next(new AppError('Audio file not found on server', 500));
    }
    
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      logger.error('File is empty (0 bytes)');
      return next(new AppError('Audio file is empty', 400));
    }
    
    logger.info(`File stats: size=${stats.size} bytes, created=${stats.birthtime.toISOString()}`);
    
    // VERY IMPORTANT: Use a shorter prompt for better reliability
    const simplePrompt = "This is a medical conversation. Accurately transcribe it.";
    
    try {
      // Load file into buffer for safer handling
      const fileBuffer = fs.readFileSync(filePath);
      logger.info(`Read file into buffer: ${fileBuffer.length} bytes`);
      
      // Initialize OpenAI with hardcoded API key
      const { OpenAI } = require('openai');
      const openai = new OpenAI({
        apiKey: apiKey  // Using the hardcoded key instead of env var
      });
      
      logger.info(`Initialized OpenAI client with provided API key`);
      
      // Create a temporary file with .webm extension (important for mime type detection)
      const tempFilePath = `${filePath}.webm`;
      fs.writeFileSync(tempFilePath, fileBuffer);
      logger.info(`Created temporary file: ${tempFilePath}`);
      
      // Create a file object from the temp file
      const file = fs.createReadStream(tempFilePath);
      
      logger.info('Starting Whisper API call...');
      
      // Simpler API call with minimal parameters
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
        prompt: simplePrompt,
        temperature: 0.0,
        language: "en"
      });
      
      logger.info('Whisper API call completed');
      
      // Clean up files
      try {
        fs.unlinkSync(filePath);
        fs.unlinkSync(tempFilePath);
        logger.info('Temporary files deleted');
      } catch (err) {
        logger.error(`Error deleting files: ${err.message}`);
      }
      
      // Verify response has text
      if (!transcription || typeof transcription.text !== 'string') {
        logger.error(`Invalid transcription response: ${JSON.stringify(transcription)}`);
        return next(new AppError('Transcription returned invalid format', 500));
      }
      
      logger.info(`Transcription successful: "${transcription.text.substring(0, 50)}..."`);
      
      // Return the transcribed text
      return res.status(200).json({
        status: 'success',
        data: {
          text: transcription.text
        }
      });
      
    } catch (apiError) {
      logger.error(`OpenAI API error: ${apiError.name} - ${apiError.message}`);
      
      if (apiError.response) {
        logger.error(`API response status: ${apiError.response.status}`);
        logger.error(`API response data: ${JSON.stringify(apiError.response.data || {})}`);
      }
      
      // Try to clean up files regardless of error
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        const tempFilePath = `${filePath}.webm`;
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      } catch (err) {
        logger.error(`Error in cleanup: ${err.message}`);
      }
      
      return next(new AppError(`OpenAI API error: ${apiError.message}`, 500));
    }
  } catch (error) {
    logger.error(`General error: ${error.name} - ${error.message}`);
    logger.error(error.stack);
    
    return next(new AppError(`Transcription failed: ${error.message}`, 500));
  }
};

/**
 * Generate clinical documentation from transcribed audio
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>}
 */
exports.generateClinicalDocumentation = async (req, res, next) => {
  try {
    // Input validation
    const { 
      transcription, 
      patientInfo, 
      existingMedications, 
      existingConditions, 
      insurancePolicy 
    } = req.body;

    if (!transcription) {
      return next(new AppError('Transcription is required', 400));
    }

    if (!patientInfo || !patientInfo.age || !patientInfo.gender || !patientInfo.visitType) {
      return next(new AppError('Patient information (age, gender, and visit type) is required', 400));
    }

    // Get clinical documentation template
    const template = getClinicalDocumentationTemplate();

    // Use hardcoded API key for OpenAI
    const apiKey = process.env.OPENAI_API_KEY || config.ai.openai.apiKey;
    
    // Initialize OpenAI client directly
    const { OpenAI } = require('openai');
    const openai = new OpenAI({
      apiKey: apiKey
    });
    
    logger.info('Generating clinical documentation from transcription...');
    
    // Prepare the prompt using handlebars-like templating
    let prompt = template.prompt;
    prompt = prompt.replace("{{transcription}}", transcription);
    prompt = prompt.replace("{{patientInfo.age}}", patientInfo.age);
    prompt = prompt.replace("{{patientInfo.gender}}", patientInfo.gender);
    prompt = prompt.replace("{{patientInfo.visitType}}", patientInfo.visitType);
    
    // Handle optional parameters
    if (existingMedications) {
      prompt = prompt.replace("{{#if existingMedications}}", "");
      prompt = prompt.replace("{{existingMedications}}", JSON.stringify(existingMedications));
      prompt = prompt.replace("{{/if}}", "");
    } else {
      prompt = prompt.replace(/{{#if existingMedications}}[\s\S]*?{{\/if}}/g, "");
    }
    
    if (existingConditions) {
      prompt = prompt.replace("{{#if existingConditions}}", "");
      prompt = prompt.replace("{{existingConditions}}", JSON.stringify(existingConditions));
      prompt = prompt.replace("{{/if}}", "");
    } else {
      prompt = prompt.replace(/{{#if existingConditions}}[\s\S]*?{{\/if}}/g, "");
    }
    
    if (insurancePolicy) {
      prompt = prompt.replace("{{#if insurancePolicy}}", "");
      prompt = prompt.replace("{{insurancePolicy}}", insurancePolicy);
      prompt = prompt.replace("{{/if}}", "");
    } else {
      prompt = prompt.replace(/{{#if insurancePolicy}}[\s\S]*?{{\/if}}/g, "");
    }
    
    // Make the API call
    const response = await openai.chat.completions.create({
      model: template.model,
      messages: [
        { role: 'system', content: 'You are a clinical documentation specialist who creates detailed, structured EMR documentation. Please return your response as valid JSON.' },
        { role: 'user', content: prompt + "\n\nPlease format your response as JSON." }
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });

    // Parse and validate the response
    const result = JSON.parse(response.choices[0].message.content);
    
    // Return the clinical documentation
    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error(`Error generating clinical documentation: ${error.message}`);
    return next(new AppError(`Failed to generate clinical documentation: ${error.message}`, 500));
  }
};

/**
 * Get the clinical documentation template
 * @returns {Object} The template object with provider and model info
 */
function getClinicalDocumentationTemplate() {
  const template = require('../templates/clinicalDocumentation');
  return template;
} 