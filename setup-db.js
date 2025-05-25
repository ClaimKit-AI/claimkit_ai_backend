// MongoDB setup script
// Run with: mongosh setup-db.js

// Switch to the claimkit_ai database (creates it if it doesn't exist)
const dbName = 'claimkit_ai';
db = db.getSiblingDB(dbName);

// Create an admin user if it doesn't exist
const adminUser = db.getUser('admin');
if (!adminUser) {
  db.createUser({
    user: 'admin',
    pwd: 'admin_password',  // Change this in production
    roles: [{ role: 'readWrite', db: dbName }, { role: 'dbAdmin', db: dbName }]
  });
  print('Admin user created.');
} else {
  print('Admin user already exists.');
}

// Create collections
db.createCollection('templates');
db.createCollection('users');

// Add initial admin user to users collection
const existingAdmin = db.users.findOne({ email: 'admin@example.com' });
if (!existingAdmin) {
  db.users.insertOne({
    name: 'Admin User',
    email: 'admin@example.com',
    password: '$2a$10$ywfXOhsqdwnVUz3XlwvxJeyPTTbLiQQwWAf4pBEEYd6xFX88vGJtq', // 'adminpassword' hashed with bcrypt
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print('Admin user added to users collection.');
} else {
  print('Admin user already exists in users collection.');
}

// Insert the default doctor notes review template
const existingTemplate = db.templates.findOne({ name: 'doctor_notes_review_standard' });
if (!existingTemplate) {
  db.templates.insertOne({
    name: 'doctor_notes_review_standard',
    description: 'Reviews doctor notes for completion and compliance with healthcare standards',
    serviceType: 'doctor_notes_review',
    provider: 'openai',
    model: 'gpt-4-turbo',
    prompt: `
You are an expert healthcare documentation specialist reviewing medical documentation for compliance and completeness.

Please review the following doctor's notes and evaluate them according to these criteria:
1. Documentation Completeness - Ensure the note includes all necessary components (chief complaint, history, examination, assessment, plan)
2. Medical Necessity - Assess if the documentation adequately supports the medical necessity of any diagnostic tests, treatments, or services
3. Specificity - Check for appropriate specificity in diagnoses and descriptions
4. Consistency - Look for any contradictions or inconsistencies in the documentation
5. Compliance with Standards - Evaluate adherence to healthcare documentation standards

Doctor's Notes:
{{notes}}

Patient Information:
- Age: {{patientAge}} 
- Gender: {{patientGender}}
- Visit Type: {{visitType}}

Please provide detailed feedback in JSON format according to the following structure:
{
  "overallRating": "1-10 scale with 10 being exceptional",
  "completeness": {
    "score": "1-10",
    "feedback": "Detailed feedback on documentation completeness",
    "missingElements": ["List of missing elements if any"]
  },
  "medicalNecessity": {
    "score": "1-10",
    "feedback": "Detailed feedback on justification for medical necessity",
    "improvementSuggestions": ["Specific suggestions for improvement"]
  },
  "specificity": {
    "score": "1-10",
    "feedback": "Feedback on diagnostic and descriptive specificity",
    "areasNeedingSpecificity": ["Areas needing more specific documentation"]
  },
  "consistency": {
    "score": "1-10",
    "feedback": "Feedback on documentation consistency",
    "contradictions": ["Any contradictory elements found"]
  },
  "complianceWithStandards": {
    "score": "1-10",
    "feedback": "Feedback on compliance with healthcare documentation standards",
    "complianceIssues": ["Specific standard violations if any"]
  },
  "recommendations": ["Prioritized list of improvement recommendations"]
}
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
      medicalNecessity: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          feedback: { type: 'string' },
          improvementSuggestions: { type: 'array', items: { type: 'string' } }
        }
      },
      specificity: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          feedback: { type: 'string' },
          areasNeedingSpecificity: { type: 'array', items: { type: 'string' } }
        }
      },
      consistency: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          feedback: { type: 'string' },
          contradictions: { type: 'array', items: { type: 'string' } }
        }
      },
      complianceWithStandards: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          feedback: { type: 'string' },
          complianceIssues: { type: 'array', items: { type: 'string' } }
        }
      },
      recommendations: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    parameters: {
      temperature: 0.2,
      max_tokens: 2000
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print('Doctor notes review template added.');
} else {
  print('Doctor notes review template already exists.');
}

print('Database setup complete for ' + dbName); 