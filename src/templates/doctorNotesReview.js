/**
 * Standard template for doctor notes review
 */
module.exports = {
  name: 'doctor_notes_review_standard',
  description: 'Reviews doctor notes for completion and compliance with healthcare standards',
  serviceType: 'doctor_notes_review',
  provider: 'openai',
  model: 'chatgpt-4o-latest',
  prompt: `
You are an expert healthcare documentation specialist with deep knowledge of Integrated Care Pathways and medical coding. Please review the following doctor notes and evaluate them according to these specific criteria:

## EVALUATION CRITERIA

1. **Diagnosis and Procedure Coherence**:
   - Medical appropriateness of diagnoses in relation to procedures
   - Alignment with clinical guidelines and standard of care
   - Logical connection between diagnoses and requested procedures
   - Absence of contradictory or unrelated procedures for the given diagnoses

2. **Medication and Diagnosis Coherence**:
   - Appropriateness of prescribed medications for the given diagnoses
   - Consideration of patient's history and allergies
   - Potential contraindications or adverse interactions
   - Logical justification for medication choices

3. **Procedure and Patient History Contradictions**:
   - Recent procedures or tests that might conflict (e.g., recent MRI within past week)
   - Previous surgeries that might impact current procedure recommendations
   - Missed therapeutic interventions that should have been tried first
   - Follow-up procedures without prior baseline procedures

4. **Procedure and Insurance Policy Coverage Alignment**:
   - Coverage of requested procedures under patient's insurance policy
   - Medical necessity documentation requirements for coverage
   - Prior authorization requirements
   - Step therapy or progressive intervention requirements

5. **Medical Coding Accuracy and Completeness**:
   - Correct ICD-10 codes for all documented diagnoses (primary and secondary)
   - Correct CPT codes for all procedures and services
   - Missing codes for documented conditions or procedures
   - Incorrect or imprecise coding specificity

6. **Documentation Completeness**:
   - Chief complaint, history, examination, assessment, plan  
   - Coherent presentation of patient's condition and care plan
   - Sufficient detail for clinical decision-making
   - Clear documentation of medical necessity

## REVIEW DATA

**Doctors Notes**: \`{{notes}}\`  
**Patient Age**: \`{{patientAge}}\`  
**Patient Gender**: \`{{patientGender}}\`  
**Visit Type**: \`{{visitType}}\`  
**Insurance Policy Details**: \`{{insurancePolicy}}\`

## IMPORTANT GUIDANCE ON MISSING ELEMENTS

Before evaluating each criterion, first identify any major missing elements from the note (e.g., missing medications, patient history, diagnoses, procedures). Report these missing elements ONLY ONCE in the "completeness" section. 

For all other sections:
- If an element is completely missing (e.g., no medications mentioned), set "isEvaluable" to false for that section and provide minimal explanation
- Only evaluate what is actually present in the notes
- If a criterion cannot be evaluated due to missing information, assign a score of 0, set "isEvaluable" to false, and briefly note "Cannot be evaluated due to missing [element]" without elaborating on the absence itself

## RESPONSE FORMAT

Please provide detailed feedback in JSON format using this structure:

{
  "overallRating": "1-10",
  "completeness": {
    "score": "1-10",
    "feedback": "...",
    "missingElements": ["..."] 
  },
  "diagnosisProcedureCoherence": {
    "isEvaluable": true/false,
    "score": "1-10 or 0 if cannot be evaluated",
    "feedback": "...",
    "issues": ["..."]
  },
  "medicationDiagnosisCoherence": {
    "isEvaluable": true/false,
    "score": "1-10 or 0 if cannot be evaluated",
    "feedback": "...",
    "contradictions": ["..."],
    "allergyConcerns": ["..."]
  },
  "procedurePatientHistoryAlignment": {
    "isEvaluable": true/false,
    "score": "1-10 or 0 if cannot be evaluated",
    "feedback": "...",
    "conflicts": ["..."],
    "recentProcedureOverlaps": ["..."]
  },
  "insurancePolicyAlignment": {
    "isEvaluable": true/false,
    "score": "1-10 or 0 if cannot be evaluated",
    "feedback": "...",
    "coverageIssues": ["..."],
    "authorizationNeeds": ["..."]
  },
  "medicalCodingAccuracy": {
    "isEvaluable": true/false,
    "score": "1-10 or 0 if cannot be evaluated",
    "feedback": "...",
    "missingCodes": ["..."],
    "incorrectCodes": ["..."],
    "codingImprovements": ["..."]
  },
  "medicalNecessity": {
    "isEvaluable": true/false,
    "score": "1-10 or 0 if cannot be evaluated",
    "feedback": "...",
    "improvementSuggestions": ["..."]
  },
  "recommendations": {
    "diagnosisImprovement": ["..."],
    "procedureAlignment": ["..."],
    "medicationOptimization": ["..."],
    "codingCorrections": ["..."],
    "documentationEnhancements": ["..."]
  }
}

## SPECIAL INSTRUCTIONS

- First identify ALL missing elements and list them ONLY in the "completeness" section
- For each criterion that cannot be evaluated due to missing information, set "isEvaluable" to false, provide a score of 0, and include minimal explanation
- Evaluate ONLY what is present in the provided notes - do not assume or invent information
- Be specific about any contradictions, inconsistencies, or misalignments found
- Provide actionable recommendations for improving each aspect of the documentation
- Focus on medical accuracy and appropriateness from clinical perspective first, then administrative/insurance concerns
- For coding issues, cite the specific ICD-10 or CPT codes that should be used instead
- Highlight any critical omissions that could impact patient care or claim processing
`,
  inputSchema: {
    notes: {
      type: 'string',
      required: true,
      description: 'The doctor notes to be reviewed'
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
    insurancePolicy: {
      type: 'string',
      required: false,
      description: 'Insurance policy details for coverage verification'
    }
  },
  outputSchema: {
    overallRating: {
      type: 'number',
      description: 'Overall rating on a scale of 1-10'
    },
    completeness: {
      type: 'object',
      properties: {
        score: { type: 'number' },
        feedback: { type: 'string' },
        missingElements: { type: 'array', items: { type: 'string' } }
      }
    },
    diagnosisProcedureCoherence: {
      type: 'object',
      properties: {
        isEvaluable: { type: 'boolean' },
        score: { type: 'number' },
        feedback: { type: 'string' },
        issues: { type: 'array', items: { type: 'string' } }
      }
    },
    medicationDiagnosisCoherence: {
      type: 'object',
      properties: {
        isEvaluable: { type: 'boolean' },
        score: { type: 'number' },
        feedback: { type: 'string' },
        contradictions: { type: 'array', items: { type: 'string' } },
        allergyConcerns: { type: 'array', items: { type: 'string' } }
      }
    },
    procedurePatientHistoryAlignment: {
      type: 'object',
      properties: {
        isEvaluable: { type: 'boolean' },
        score: { type: 'number' },
        feedback: { type: 'string' },
        conflicts: { type: 'array', items: { type: 'string' } },
        recentProcedureOverlaps: { type: 'array', items: { type: 'string' } }
      }
    },
    insurancePolicyAlignment: {
      type: 'object',
      properties: {
        isEvaluable: { type: 'boolean' },
        score: { type: 'number' },
        feedback: { type: 'string' },
        coverageIssues: { type: 'array', items: { type: 'string' } },
        authorizationNeeds: { type: 'array', items: { type: 'string' } }
      }
    },
    medicalCodingAccuracy: {
      type: 'object',
      properties: {
        isEvaluable: { type: 'boolean' },
        score: { type: 'number' },
        feedback: { type: 'string' },
        missingCodes: { type: 'array', items: { type: 'string' } },
        incorrectCodes: { type: 'array', items: { type: 'string' } },
        codingImprovements: { type: 'array', items: { type: 'string' } }
      }
    },
    medicalNecessity: {
      type: 'object',
      properties: {
        isEvaluable: { type: 'boolean' },
        score: { type: 'number' },
        feedback: { type: 'string' },
        improvementSuggestions: { type: 'array', items: { type: 'string' } }
      }
    },
    recommendations: {
      type: 'object',
      properties: {
        diagnosisImprovement: { type: 'array', items: { type: 'string' } },
        procedureAlignment: { type: 'array', items: { type: 'string' } },
        medicationOptimization: { type: 'array', items: { type: 'string' } },
        codingCorrections: { type: 'array', items: { type: 'string' } },
        documentationEnhancements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  parameters: {
    temperature: 0.2,
    max_tokens: 2000
  }
}; 