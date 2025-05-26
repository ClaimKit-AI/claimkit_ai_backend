const { db } = require('../config/firebase');
const logger = require('../utils/logger');

/**
 * Script to populate Firestore with detailed patient data and visit history
 */

// Collections
const patientsCollection = 'patients';
const visitsCollection = 'visits';

// Common data for both patients and visits
const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker'];

// Patient data generator
const generatePatients = () => {
  const genders = ['male', 'female'];
  const maleFirstNames = ['James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark'];
  const femaleFirstNames = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra'];
  
  const medicalConditions = {
    chronic: [
      'Type 2 Diabetes',
      'Hypertension',
      'Asthma',
      'COPD',
      'Rheumatoid Arthritis',
      'Osteoarthritis',
      'Coronary Artery Disease',
      'Congestive Heart Failure',
      'Atrial Fibrillation',
      'Chronic Kidney Disease',
      'Hypothyroidism',
      'Hyperthyroidism',
      'Alzheimer\'s Disease',
      'Parkinson\'s Disease',
      'Multiple Sclerosis',
      'Epilepsy',
      'Psoriasis',
      'Crohn\'s Disease',
      'Ulcerative Colitis',
      'Migraines'
    ],
    acute: [
      'Upper Respiratory Infection',
      'Urinary Tract Infection',
      'Gastroenteritis',
      'Pneumonia',
      'Influenza',
      'Sinusitis',
      'Acute Bronchitis',
      'Cellulitis',
      'Otitis Media',
      'Conjunctivitis'
    ],
    surgical: [
      'Appendectomy',
      'Cholecystectomy',
      'Hysterectomy',
      'Tonsillectomy',
      'Hernia Repair',
      'Joint Replacement',
      'CABG',
      'Mastectomy',
      'Prostatectomy',
      'Thyroidectomy'
    ],
    allergies: [
      'Penicillin',
      'Sulfa drugs',
      'NSAIDs',
      'Latex',
      'Shellfish',
      'Peanuts',
      'Tree nuts',
      'Eggs',
      'Milk',
      'Wheat',
      'Soy',
      'Bee stings'
    ]
  };
  
  const medications = [
    'Lisinopril 10mg daily',
    'Metformin 500mg twice daily',
    'Levothyroxine 50mcg daily',
    'Atorvastatin 20mg daily',
    'Amlodipine 5mg daily',
    'Metoprolol 25mg twice daily',
    'Sertraline 50mg daily',
    'Omeprazole 20mg daily',
    'Albuterol inhaler as needed',
    'Aspirin 81mg daily',
    'Warfarin 5mg daily',
    'Furosemide 20mg daily',
    'Prednisone 5mg daily',
    'Gabapentin 300mg three times daily',
    'Hydrochlorothiazide 25mg daily',
    'Losartan 50mg daily',
    'Simvastatin 40mg daily',
    'Alprazolam 0.5mg as needed',
    'Tramadol 50mg as needed',
    'Escitalopram 10mg daily'
  ];
  
  // Generate 20 patients with varying information
  const patients = [];
  
  for (let i = 1; i <= 20; i++) {
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const firstName = gender === 'male' 
      ? maleFirstNames[Math.floor(Math.random() * maleFirstNames.length)]
      : femaleFirstNames[Math.floor(Math.random() * femaleFirstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const age = Math.floor(Math.random() * 60) + 20; // Ages 20-80
    
    // Generate random medical history (1-3 chronic conditions)
    const numChronicConditions = Math.floor(Math.random() * 3) + 1;
    const chronicConditionIndices = [];
    
    while (chronicConditionIndices.length < numChronicConditions) {
      const index = Math.floor(Math.random() * medicalConditions.chronic.length);
      if (!chronicConditionIndices.includes(index)) {
        chronicConditionIndices.push(index);
      }
    }
    
    const medicalHistory = chronicConditionIndices.map(index => medicalConditions.chronic[index]);
    
    // Maybe add a surgical history (30% chance)
    if (Math.random() < 0.3) {
      const surgicalIndex = Math.floor(Math.random() * medicalConditions.surgical.length);
      const yearAgo = Math.floor(Math.random() * 10) + 1;
      medicalHistory.push(`${medicalConditions.surgical[surgicalIndex]} (${yearAgo} years ago)`);
    }
    
    // Generate medications (1-3 medications)
    const numMedications = Math.floor(Math.random() * 3) + 1;
    const medicationIndices = [];
    
    while (medicationIndices.length < numMedications) {
      const index = Math.floor(Math.random() * medications.length);
      if (!medicationIndices.includes(index)) {
        medicationIndices.push(index);
      }
    }
    
    const currentMedications = medicationIndices.map(index => medications[index]);
    
    // Generate allergies (0-2 allergies)
    const numAllergies = Math.floor(Math.random() * 3);
    const allergyIndices = [];
    
    while (allergyIndices.length < numAllergies) {
      const index = Math.floor(Math.random() * medicalConditions.allergies.length);
      if (!allergyIndices.includes(index)) {
        allergyIndices.push(index);
      }
    }
    
    const allergies = allergyIndices.map(index => medicalConditions.allergies[index]);
    
    // Create patient object
    patients.push({
      name: `${firstName} ${lastName}`,
      gender,
      age,
      dateOfBirth: generateBirthDate(age),
      medicalHistory,
      currentMedications,
      allergies: allergies.length > 0 ? allergies : ['No known allergies'],
      contactInfo: {
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
      }
    });
  }
  
  return patients;
};

// Generate visit data for each patient
const generateVisits = (patientId) => {
  // Generate random number of visits (1-6)
  const numVisits = Math.floor(Math.random() * 6) + 1;
  const visits = [];
  
  const visitReasons = [
    'Annual physical',
    'Follow-up appointment',
    'Acute illness',
    'Chronic condition management',
    'Medication review',
    'Preventive care',
    'Lab results review',
    'Specialist referral',
    'Pre-operative assessment',
    'Post-operative follow-up'
  ];
  
  const diagnoses = [
    'Hypertension, well-controlled',
    'Type 2 Diabetes, needs adjustment',
    'Upper respiratory infection',
    'Urinary tract infection',
    'Hyperlipidemia',
    'Anxiety disorder',
    'Depression',
    'Osteoarthritis',
    'Gastroesophageal reflux disease',
    'Insomnia',
    'Seasonal allergies',
    'Hypothyroidism',
    'Migraine',
    'Low back pain',
    'Asthma exacerbation'
  ];
  
  const providers = [
    'Dr. Smith',
    'Dr. Johnson',
    'Dr. Williams',
    'Dr. Brown',
    'Dr. Davis',
    'Dr. Miller',
    'Dr. Wilson',
    'Dr. Moore',
    'Dr. Taylor',
    'Dr. Anderson'
  ];
  
  // Decide if patient should have a recent visit or not (25% chance of no recent visit)
  const hasRecentVisit = Math.random() > 0.25;
  
  // Current date for reference
  const now = new Date();
  
  for (let i = 0; i < numVisits; i++) {
    const visitDate = new Date();
    
    // If this is the most recent visit and patient should have a recent one
    if (i === 0 && hasRecentVisit) {
      // Last visit between 1 day and 5 months ago
      const daysAgo = Math.floor(Math.random() * 150) + 1;
      visitDate.setDate(visitDate.getDate() - daysAgo);
    } else if (i === 0 && !hasRecentVisit) {
      // Last visit between 7 and 24 months ago (so it fails the 6-month check)
      const daysAgo = Math.floor(Math.random() * 540) + 210; // 7-24 months in days
      visitDate.setDate(visitDate.getDate() - daysAgo);
    } else {
      // Earlier visits progressively further in the past
      const previousVisitDate = new Date(visits[i-1].date);
      const monthsGap = Math.floor(Math.random() * 6) + 2; // 2-8 months between visits
      visitDate.setTime(previousVisitDate.getTime());
      visitDate.setMonth(visitDate.getMonth() - monthsGap);
    }
    
    const visitReason = visitReasons[Math.floor(Math.random() * visitReasons.length)];
    const diagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)];
    const provider = providers[Math.floor(Math.random() * providers.length)];
    
    // Calculate vitals based on whether they were normal or not
    const systolic = Math.floor(Math.random() * 40) + 110; // 110-150
    const diastolic = Math.floor(Math.random() * 30) + 60; // 60-90
    const heartRate = Math.floor(Math.random() * 40) + 60; // 60-100
    const temperature = (Math.random() * 1.5 + 36.2).toFixed(1); // 36.2-37.7
    
    visits.push({
      patientId,
      date: visitDate,
      formattedDate: visitDate.toISOString().split('T')[0], // YYYY-MM-DD format
      reason: visitReason,
      diagnosis,
      vitals: {
        bloodPressure: `${systolic}/${diastolic}`,
        heartRate: `${heartRate} bpm`,
        temperature: `${temperature}°C`,
        weight: `${Math.floor(Math.random() * 40) + 60} kg`
      },
      notes: `Patient came in for ${visitReason.toLowerCase()}. ${diagnosis} was diagnosed. Follow up in ${Math.floor(Math.random() * 6) + 1} months.`,
      provider
    });
  }
  
  // Sort visits by date, most recent first
  return visits.sort((a, b) => b.date - a.date);
};

// Helper function to generate a realistic birth date based on age
function generateBirthDate(age) {
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = Math.floor(Math.random() * 28) + 1; // Avoid invalid dates by using 1-28
  
  return new Date(birthYear, birthMonth, birthDay).toISOString().split('T')[0];
}

// Function to populate Firestore
const populateFirestore = async () => {
  try {
    logger.info('Starting Firestore population with detailed patient data...');
    
    // Check if patients collection already has detailed data
    const patientsSnapshot = await db.collection(patientsCollection).limit(1).get();
    const firstPatient = patientsSnapshot.empty ? null : patientsSnapshot.docs[0].data();
    
    let patientRefs = [];
    
    // Check if visits collection exists and has data
    const visitsSnapshot = await db.collection(visitsCollection).limit(1).get();
    const hasVisits = !visitsSnapshot.empty;
    
    if (!patientsSnapshot.empty && firstPatient && firstPatient.contactInfo && hasVisits) {
      logger.info('Detailed patient data and visits already exist in Firestore. Skipping population.');
      return;
    }
    
    // If we already have patients but no visits, get existing patients
    if (!patientsSnapshot.empty && firstPatient && firstPatient.contactInfo && !hasVisits) {
      logger.info('Patients exist but no visits found. Creating visits for existing patients...');
      
      // Get all existing patients
      const allPatientsSnapshot = await db.collection(patientsCollection).get();
      allPatientsSnapshot.forEach(doc => {
        patientRefs.push({ id: doc.id, ref: doc.ref });
      });
      
      logger.info(`Found ${patientRefs.length} existing patients to create visits for.`);
    } else {
      // Generate and store new patients
      logger.info('Creating new patients...');
      const patients = generatePatients();
      
      // Batch write patients
      const patientBatch = db.batch();
      
      patients.forEach(patient => {
        const patientRef = db.collection(patientsCollection).doc();
        patientRefs.push({ id: patientRef.id, ref: patientRef });
        patientBatch.set(patientRef, patient);
      });
      
      await patientBatch.commit();
      logger.info(`${patients.length} detailed patients created successfully.`);
    }
    
    // Generate and store visits for each patient
    logger.info('Generating visit history for patients...');
    let totalVisits = 0;
    
    // Process in smaller batches to avoid overloading Firestore
    for (let i = 0; i < patientRefs.length; i++) {
      const visitBatch = db.batch();
      const patientId = patientRefs[i].id;
      const visits = generateVisits(patientId);
      totalVisits += visits.length;
      
      // Update patient with lastVisitDate
      await db.collection(patientsCollection).doc(patientId).update({
        lastVisitDate: visits[0].date
      });
      
      // Add visits to visits collection
      visits.forEach(visit => {
        const visitRef = db.collection(visitsCollection).doc();
        visitBatch.set(visitRef, visit);
      });
      
      await visitBatch.commit();
      logger.info(`Generated ${visits.length} visits for patient ${i+1}/${patientRefs.length}`);
    }
    
    logger.info(`Firestore population complete. Created visits for ${patientRefs.length} patients with ${totalVisits} total visits.`);
  } catch (error) {
    logger.error(`Error populating Firestore with detailed data: ${error.message}`);
    throw error;
  }
};

// Execute if run directly
if (require.main === module) {
  populateFirestore()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { populateFirestore }; 