/**
 * Clinical Documentation Template
 * Generates comprehensive clinical documentation from transcribed patient encounters
 */

module.exports = {
  name: 'Clinical Documentation Generator',
  description: 'Generates a complete clinical document from transcribed doctor-patient conversation',
  provider: 'openai',
  model: 'gpt-4-turbo',
  serviceType: 'clinical_documentation',
  version: '1.0',
  isActive: true,
  inputSchema: {
    transcription: {
      type: 'string',
      required: true,
      description: 'The transcribed text of the doctor-patient encounter'
    },
    patientInfo: {
      type: 'object',
      required: true,
      description: 'Patient information',
      properties: {
        age: {
          type: 'string',
          required: true
        },
        gender: {
          type: 'string',
          required: true
        },
        visitType: {
          type: 'string',
          required: true
        }
      }
    },
    existingMedications: {
      type: 'array',
      required: false,
      description: 'List of medications the patient is currently taking'
    },
    existingConditions: {
      type: 'array',
      required: false,
      description: 'List of pre-existing conditions the patient has'
    },
    insurancePolicy: {
      type: 'string',
      required: false,
      description: 'Insurance policy details for coverage verification and compliance'
    }
  },
  outputSchema: {
    clinicalDocumentation: {
      type: 'object',
      properties: {
        chiefComplaint: {
          type: 'string',
          description: 'The primary reason for the patient visit'
        },
        secondaryComplaints: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Additional complaints mentioned by the patient'
        },
        historyOfPresentIllness: {
          type: 'string',
          description: 'Detailed narrative of the current medical issue'
        },
        pastMedicalHistory: {
          type: 'object',
          properties: {
            conditions: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            surgeries: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            allergies: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        },
        vitalSigns: {
          type: 'object',
          properties: {
            bloodPressure: { type: 'string' },
            heartRate: { type: 'string' },
            respiratoryRate: { type: 'string' },
            temperature: { type: 'string' },
            oxygenSaturation: { type: 'string' },
            height: { type: 'string' },
            weight: { type: 'string' },
            bmi: { type: 'string' }
          }
        },
        physicalExamination: {
          type: 'object',
          description: 'Findings from the physical examination'
        },
        assessments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              diagnosis: { type: 'string' },
              icdCode: { type: 'string' },
              certainty: { type: 'string' },
              clinicalEvidence: { type: 'string' }
            }
          }
        },
        medications: {
          type: 'object',
          properties: {
            prescribed: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  dosage: { type: 'string' },
                  frequency: { type: 'string' },
                  duration: { type: 'string' },
                  instructions: { type: 'string' }
                }
              }
            },
            suggested: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  dosage: { type: 'string' },
                  frequency: { type: 'string' },
                  duration: { type: 'string' },
                  instructions: { type: 'string' },
                  rationale: { type: 'string' }
                }
              }
            }
          }
        },
        treatmentPlan: {
          type: 'object',
          properties: {
            prescribed: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  treatment: { type: 'string' },
                  instructions: { type: 'string' },
                  duration: { type: 'string' }
                }
              }
            },
            suggested: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  treatment: { type: 'string' },
                  instructions: { type: 'string' },
                  duration: { type: 'string' },
                  rationale: { type: 'string' }
                }
              }
            }
          }
        },
        procedures: {
          type: 'object',
          properties: {
            performed: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  cptCode: { type: 'string' },
                  notes: { type: 'string' }
                }
              }
            },
            suggested: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  cptCode: { type: 'string' },
                  medicalNecessity: { type: 'string' },
                  rationale: { type: 'string' }
                }
              }
            }
          }
        },
        followUp: {
          type: 'object',
          properties: {
            timing: { type: 'string' },
            instructions: { type: 'string' },
            referrals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  speciality: { type: 'string' },
                  reason: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },
  prompt: `
You are ClaimDoc AI, a clinical documentation assistant specializing in generating comprehensive medical documentation from doctor-patient encounter transcripts. Your task is to analyze the provided transcription and generate a complete EMR-ready clinical document following medical documentation best practices.

### TRANSCRIPTION:
{{transcription}}

### PATIENT INFO:
- Age: {{patientInfo.age}}
- Gender: {{patientInfo.gender}}
- Visit Type: {{patientInfo.visitType}}
{{#if existingMedications}}
- Current Medications: {{existingMedications}}
{{/if}}
{{#if existingConditions}}
- Known Conditions: {{existingConditions}}
{{/if}}
{{#if insurancePolicy}}
- Insurance: {{insurancePolicy}}
{{/if}}

### INSTRUCTIONS:
1. Extract all relevant clinical information from the transcription
2. Identify the chief complaint and any secondary complaints
3. Document any mentions of history of present illness, past medical history, and allergies
4. Document any vital signs or examination findings mentioned
5. Identify diagnoses and assign appropriate ICD-10 codes
6. Clearly separate medications, treatments, and procedures into:
   - Those explicitly prescribed/performed by the doctor
   - Those that could be suggested based on standard of care
7. Structure the document according to standard clinical documentation format

### IMPORTANT GUIDELINES:
- Be factual and objective - only include information supported by the transcription
- Use standard medical terminology and formatting
- Be comprehensive but concise
- For any prescribed treatments, provide relevant details (dosage, frequency, etc.)
- For suggested treatments, provide clear rationale
- Include appropriate ICD-10 and CPT codes where applicable
- Ensure all suggested treatments are evidence-based and appropriate
- Flag any potential inconsistencies or areas needing clarification

Return a comprehensive, well-structured clinical document that could be used in an EMR system.
`,
  /**
   * Get the clinical documentation template
   * @returns {Object} The template object
   */
  getTemplate: function() {
    return {
      provider: this.provider,
      model: this.model,
      serviceType: this.serviceType
    };
  }
}; 