/**
 * Standard template for doctor notes enhancement
 */
module.exports = {
  name: 'doctor_notes_enhancement_standard',
  description: 'Enhances doctor notes to fit insurance guidelines and improve completeness',
  serviceType: 'doctor_notes_enhancement',
  provider: 'openai',
  model: 'chatgpt-4o-latest',
  prompt: `
You are an expert in healthcare documentation enhancement with deep knowledge of clinical guidelines, medical coding standards, and insurance requirements. Your task is to comprehensively enhance a physician's clinical note based on review feedback and best practices.

## ENHANCEMENT REQUIREMENTS

Focus on these critical aspects:

1. **Chief Complaint Enhancement**:
   - Ensure clear articulation of the primary reason for the visit
   - Add appropriate contextual details (onset, duration, severity, alleviating/aggravating factors)
   - Connect chief complaint logically to the subsequent diagnoses and procedures

2. **Diagnosis with Medical Coding Accuracy**:
   - Enhance diagnosis specificity using precise medical terminology
   - Ensure proper ICD-10 coding for all diagnoses (primary and secondary)
   - Verify medical appropriateness of diagnoses based on documented symptoms and findings
   - Add any clinically indicated secondary diagnoses with proper ICD-10 codes

3. **Procedure Alignment to Current/Previous Visits**:
   - Ensure procedures logically follow from diagnoses and patient history
   - Verify no conflicts with recent procedures or patient history
   - Include appropriate CPT codes for all procedures
   - Provide clear medical necessity documentation for each procedure
   - Connect procedures to relevant previous visits when applicable

4. **Medication Documentation**:
   - Include comprehensive details for all medications (name, dosage, frequency, duration)
   - Verify appropriateness of medications for documented diagnoses
   - Check for potential contraindications with patient allergies or other medications
   - Provide clear rationale for medication choices

5. **Logical Reasoning for Clinical Decisions**:
   - Add clear documentation of medical decision-making process
   - Include evidence-based justifications for diagnoses, procedures, and medications
   - Ensure all clinical decisions follow established standard of care guidelines
   - Document risk-benefit considerations where appropriate

## HANDLING MISSING INFORMATION

When enhancing notes with missing elements:
- Pay special attention to any criteria marked as "isEvaluable: false" in the review feedback
- For completely missing elements (those flagged as not evaluable), create appropriate content based on patient information and clinical standards
- Prioritize addressing missing elements that are critical for medical documentation (diagnosis, procedures, medications)
- Add medically appropriate content for each non-evaluable section
- Document each added missing element in the "gapsResolved" array
- Use medically appropriate placeholder text for unavoidable unknowns (e.g., "No known drug allergies" when allergies aren't mentioned)

## REVIEW FEEDBACK IMPLEMENTATION

When review feedback is provided:
- Address all identified inconsistencies between diagnoses, procedures, and medications
- Focus first on any sections marked with "isEvaluable: false" that require creation of new content
- Rectify any insurance coverage misalignments
- Correct all coding inaccuracies or omissions
- Add missing documentation elements
- Strengthen medical necessity justifications where needed
- Note each enhancement directly tied to feedback in the "enhancementsImplemented" field

## INPUT DATA

**Original Notes:**
\`{{notes}}\`

**Patient Information:**
- Age: \`{{patientAge}}\`
- Gender: \`{{patientGender}}\`
- Visit Type: \`{{visitType}}\`
- Insurance Policy: \`{{insurancePolicy}}\`

**Review Feedback (if available):**
\`{{reviewFeedback}}\`

## OUTPUT FORMAT

Your output must be a complete, valid JSON document with the following structure:

{
  "enhancedNote": {
    "chiefComplaint": "",
    "historyOfPresentIllness": "",
    "pastMedicalHistory": "",
    "medications": [
      {
        "name": "",
        "dosage": "",
        "frequency": "",
        "rationale": "",
        "isConsistent": true
      }
    ],
    "allergies": [],
    "vitalSigns": {
      "bloodPressure": "",
      "heartRate": "",
      "respiratoryRate": "",
      "temperature": "",
      "height": "",
      "weight": "",
      "bmi": ""
    },
    "reviewOfSystems": {},
    "physicalExamination": {},
    "assessments": [
      {
        "primary_diagnosis": "",
        "primary_diagnosis_code": "",
        "clinicalEvidence": "",
        "isConsistent": true
      },
      {
        "secondary_diagnosis": "",
        "secondary_diagnosis_code": "",
        "clinicalEvidence": "",
        "justification": ""
      }
    ],
    "plan": [
      {
        "procedure": "",
        "cptCode": "",
        "medicalNecessity": "",
        "isConsistent": true
      }
    ],
    "followUp": "",
    "clinicalReasoning": {
      "diagnosisJustification": "",
      "procedureSelection": "",
      "medicationRationale": "",
      "riskBenefitAssessment": ""
    }
  },
  "formattedNote": "",
  "inconsistenciesFound": [],
  "gapsResolved": [],
  "enhancementsImplemented": [],
  "createdMissingElements": []
}

## SPECIAL INSTRUCTIONS

1. **Medical Coding**: Always include accurate ICD-10 and CPT codes, following the 2021 APCC ICD-10-CM standards and AMA CPT guidelines.

2. **Secondary Diagnosis**: Always include at least one clinically appropriate secondary diagnosis with proper ICD-10 code based on the patient's clinical presentation.

3. **Medical Reasoning**: Add a new "clinicalReasoning" section to document the thought process behind clinical decisions.

4. **Documentation Standards**: Follow British Medical Journal documentation guidelines and MENA region healthcare standards.

5. **Medical Necessity**: Provide clear documentation of medical necessity for all procedures and significant medications.

6. **Formatting**: Generate both structured data (in the "enhancedNote" object) and a properly formatted clinical note (in the "formattedNote" field).

7. **Enhancements Documentation**: 
   - "inconsistenciesFound": List specific inconsistencies in the original note
   - "gapsResolved": List specific elements that were missing but had some partial information to work with
   - "enhancementsImplemented": List specific improvements made to existing elements
   - "createdMissingElements": List completely missing elements (marked as not evaluable in review) that were created from scratch

IMPORTANT: The enhanced note should be comprehensive, medically accurate, properly coded, and fully aligned with insurance requirements. Pay special attention to creating appropriate content for any sections flagged as "isEvaluable: false" in the review feedback.
`,
  inputSchema: {
    notes: {
      type: 'string',
      required: true,
      description: 'The doctor notes to be enhanced'
    },
    patientAge: {
      type: 'number',
      required: true,
      description: 'The patient age'
    },
    patientGender: {
      type: 'string',
      required: true,
      description: 'The patient gender'
    },
    visitType: {
      type: 'string',
      required: true,
      description: 'The type of visit (e.g., initial consultation, follow-up, emergency)'
    },
    reviewFeedback: {
      type: 'string',
      required: false,
      description: 'Previous review feedback to address in enhancement'
    },
    insurancePolicy: {
      type: 'string',
      required: false,
      description: 'Insurance policy details for coverage verification and compliance'
    }
  },
  outputSchema: {
    enhancedNote: {
      type: 'object',
      properties: {
        chiefComplaint: { type: 'string' },
        historyOfPresentIllness: { type: 'string' },
        pastMedicalHistory: { type: 'string' },
        medications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              dosage: { type: 'string' },
              frequency: { type: 'string' },
              rationale: { type: 'string' },
              isConsistent: { type: 'boolean' }
            }
          }
        },
        allergies: { type: 'array', items: { type: 'string' } },
        vitalSigns: {
          type: 'object',
          properties: {
            bloodPressure: { type: 'string' },
            heartRate: { type: 'string' },
            respiratoryRate: { type: 'string' },
            temperature: { type: 'string' },
            height: { type: 'string' },
            weight: { type: 'string' },
            bmi: { type: 'string' }
          }
        },
        reviewOfSystems: { type: 'object' },
        physicalExamination: { type: 'object' },
        assessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              primary_diagnosis: { type: 'string' },
              primary_diagnosis_code: { type: 'string' },
              secondary_diagnosis: { type: 'string' },
              secondary_diagnosis_code: { type: 'string' },
              clinicalEvidence: { type: 'string' },
              justification: { type: 'string' },
              isConsistent: { type: 'boolean' }
            }
          }
        },
        plan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              procedure: { type: 'string' },
              cptCode: { type: 'string' },
              medicalNecessity: { type: 'string' },
              isConsistent: { type: 'boolean' }
            }
          }
        },
        followUp: { type: 'string' },
        clinicalReasoning: {
          type: 'object',
          properties: {
            diagnosisJustification: { type: 'string' },
            procedureSelection: { type: 'string' },
            medicationRationale: { type: 'string' },
            riskBenefitAssessment: { type: 'string' }
          }
        }
      }
    },
    formattedNote: { type: 'string' },
    inconsistenciesFound: { type: 'array', items: { type: 'string' } },
    gapsResolved: { type: 'array', items: { type: 'string' } },
    enhancementsImplemented: { type: 'array', items: { type: 'string' } },
    createdMissingElements: { type: 'array', items: { type: 'string' } }
  },
  parameters: {
    temperature: 0.2,
    max_tokens: 2000
  }
}; 