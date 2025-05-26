const { db } = require('../config/firebase');
const logger = require('./logger');

/**
 * Generate mock data for Firestore
 */
const mockData = {
  /**
   * Generate mock patients
   * @param {number} count - Number of patients to generate
   * @returns {Promise<Array>} - Generated patients
   */
  async generatePatients(count = 10) {
    try {
      logger.info(`Generating ${count} mock patients...`);
      
      const batch = db.batch();
      const patients = [];
      
      // Mock data arrays
      const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Emma', 'William', 'Olivia', 'James', 'Sophia', 'Mohammed', 'Fatima', 'Ahmed', 'Aisha'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Khan', 'Ali'];
      const genders = ['male', 'female'];
      const conditions = ['Hypertension', 'Diabetes', 'Asthma', 'Arthritis', 'Depression', 'Anxiety', 'Obesity', 'Hypothyroidism', 'Hyperlipidemia', 'GERD'];
      const allergies = ['Penicillin', 'Peanuts', 'Latex', 'Shellfish', 'Eggs', 'Soy', 'Milk', 'Wheat', 'Tree nuts', 'Sulfa drugs'];
      const medications = ['Lisinopril', 'Metformin', 'Albuterol', 'Levothyroxine', 'Atorvastatin', 'Omeprazole', 'Amlodipine', 'Sertraline', 'Ibuprofen', 'Acetaminophen'];
      const surgeries = ['Appendectomy', 'Cholecystectomy', 'Hernia repair', 'Tonsillectomy', 'Cesarean section', 'Hip replacement', 'Knee replacement', 'LASIK', 'Coronary bypass', 'Hysterectomy'];
      const insuranceProviders = ['Blue Cross', 'Aetna', 'Cigna', 'UnitedHealthcare', 'Humana', 'Kaiser Permanente', 'Medicare', 'Medicaid', 'Tricare', 'HealthNet'];
      
      for (let i = 0; i < count; i++) {
        // Generate random data
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const gender = genders[Math.floor(Math.random() * genders.length)];
        
        // Generate random date of birth (18-80 years old)
        const now = new Date();
        const years = Math.floor(Math.random() * 62) + 18; // 18-80 years
        const birthDate = new Date(now.getFullYear() - years, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        
        // Generate patient data
        const patient = {
          firstName,
          lastName,
          dateOfBirth: birthDate,
          gender,
          contactInfo: {
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
            phone: `+1${Math.floor(Math.random() * 900000000) + 1000000000}`,
            address: `${Math.floor(Math.random() * 9000) + 1000} Main St, City, State, ${Math.floor(Math.random() * 90000) + 10000}`
          },
          medicalHistory: {
            conditions: getRandomItems(conditions, Math.floor(Math.random() * 3)),
            allergies: getRandomItems(allergies, Math.floor(Math.random() * 2)),
            medications: getRandomItems(medications, Math.floor(Math.random() * 3)),
            surgeries: getRandomItems(surgeries, Math.floor(Math.random() * 2))
          },
          insuranceInfo: {
            provider: insuranceProviders[Math.floor(Math.random() * insuranceProviders.length)],
            policyNumber: `POL${Math.floor(Math.random() * 900000000) + 1000000000}`,
            groupNumber: `GRP${Math.floor(Math.random() * 9000) + 1000}`,
            coverage: ['Basic', 'Premium', 'Gold'][Math.floor(Math.random() * 3)]
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Add to batch
        const patientRef = db.collection('patients').doc();
        batch.set(patientRef, patient);
        
        // Add to result
        patients.push({ id: patientRef.id, ...patient });
      }
      
      // Commit batch
      await batch.commit();
      
      logger.info(`Generated ${patients.length} mock patients`);
      return patients;
    } catch (error) {
      logger.error(`Error generating mock patients: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Generate mock visits for patients
   * @param {Array} patients - Array of patients
   * @param {number} visitsPerPatient - Number of visits per patient
   * @returns {Promise<Array>} - Generated visits
   */
  async generateVisits(patients, visitsPerPatient = 3) {
    try {
      logger.info(`Generating ${visitsPerPatient} visits for ${patients.length} patients...`);
      
      const batch = db.batch();
      const visits = [];
      
      // Mock data arrays
      const visitTypes = ['Annual physical', 'Sick visit', 'Follow-up', 'Consultation', 'Emergency', 'Specialist referral'];
      const providerNames = ['Dr. Johnson', 'Dr. Smith', 'Dr. Williams', 'Dr. Davis', 'Dr. Miller', 'Dr. Wilson', 'Dr. Taylor', 'Dr. Anderson'];
      const chiefComplaints = ['Fever', 'Cough', 'Headache', 'Abdominal pain', 'Back pain', 'Chest pain', 'Shortness of breath', 'Dizziness', 'Fatigue', 'Nausea'];
      const diagnosisCodes = ['J00', 'I10', 'E11.9', 'M54.5', 'J45.909', 'F41.9', 'K21.9', 'G43.909', 'N39.0', 'L30.9'];
      const diagnosisDescriptions = ['Common cold', 'Hypertension', 'Type 2 diabetes', 'Low back pain', 'Asthma', 'Anxiety disorder', 'GERD', 'Migraine', 'UTI', 'Dermatitis'];
      const procedureCodes = ['99213', '99214', '99396', '99395', '20610', '36415', '90471', '99000', '93000', '81002'];
      const procedureDescriptions = ['Office visit', 'Office visit, established patient', 'Annual physical', 'Annual physical, established patient', 'Joint injection', 'Venipuncture', 'Immunization', 'Specimen handling', 'ECG', 'Urinalysis'];
      
      for (const patient of patients) {
        for (let i = 0; i < visitsPerPatient; i++) {
          // Generate random date (within the last 2 years)
          const now = new Date();
          const visitDate = new Date(now.getTime() - Math.floor(Math.random() * 730) * 24 * 60 * 60 * 1000);
          
          // Generate random vital signs
          const temperature = (Math.random() * 2 + 97).toFixed(1);
          const systolic = Math.floor(Math.random() * 40) + 100;
          const diastolic = Math.floor(Math.random() * 30) + 60;
          const bloodPressure = `${systolic}/${diastolic}`;
          const heartRate = Math.floor(Math.random() * 40) + 60;
          const respiratoryRate = Math.floor(Math.random() * 8) + 12;
          const oxygenSaturation = Math.floor(Math.random() * 5) + 95;
          
          // Calculate height and weight based on patient gender
          const heightInches = patient.gender === 'male' ? Math.floor(Math.random() * 12) + 64 : Math.floor(Math.random() * 12) + 60;
          const heightCm = Math.round(heightInches * 2.54);
          const weightLbs = patient.gender === 'male' ? Math.floor(Math.random() * 60) + 140 : Math.floor(Math.random() * 50) + 120;
          const weightKg = Math.round(weightLbs * 0.453592);
          const bmi = (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
          
          // Generate random diagnosis
          const diagnosisIndex = Math.floor(Math.random() * diagnosisCodes.length);
          const diagnosis = {
            code: diagnosisCodes[diagnosisIndex],
            description: diagnosisDescriptions[diagnosisIndex],
            isPrimary: true
          };
          
          // Generate random procedure
          const procedureIndex = Math.floor(Math.random() * procedureCodes.length);
          const procedure = {
            code: procedureCodes[procedureIndex],
            description: procedureDescriptions[procedureIndex],
            notes: 'Procedure completed without complications.'
          };
          
          // Generate visit data
          const visit = {
            patientId: patient.id,
            visitDate,
            visitType: visitTypes[Math.floor(Math.random() * visitTypes.length)],
            providerId: `PROV${Math.floor(Math.random() * 10000)}`,
            providerName: providerNames[Math.floor(Math.random() * providerNames.length)],
            chiefComplaint: chiefComplaints[Math.floor(Math.random() * chiefComplaints.length)],
            vitalSigns: {
              temperature: parseFloat(temperature),
              bloodPressure,
              heartRate,
              respiratoryRate,
              oxygenSaturation,
              height: heightCm,
              weight: weightKg,
              bmi: parseFloat(bmi)
            },
            diagnosis: [diagnosis],
            procedures: [procedure],
            medications: patient.medicalHistory.medications.map(med => ({
              name: med,
              dosage: `${Math.floor(Math.random() * 4) * 5 + 5}mg`,
              frequency: ['once daily', 'twice daily', 'three times daily', 'as needed'][Math.floor(Math.random() * 4)],
              instructions: 'Take with food.'
            })),
            notes: `Patient presented with ${chiefComplaints[Math.floor(Math.random() * chiefComplaints.length)].toLowerCase()}. Examination revealed ${diagnosis.description.toLowerCase()}. Treatment plan discussed and medication prescribed.`,
            followUp: ['2 weeks', '1 month', '3 months', '6 months', 'as needed'][Math.floor(Math.random() * 5)],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Add to batch
          const visitRef = db.collection('visits').doc();
          batch.set(visitRef, visit);
          
          // Add to result
          visits.push({ id: visitRef.id, ...visit });
        }
      }
      
      // Commit batch
      await batch.commit();
      
      logger.info(`Generated ${visits.length} mock visits`);
      return visits;
    } catch (error) {
      logger.error(`Error generating mock visits: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Generate all mock data
   * @param {number} patientCount - Number of patients to generate
   * @param {number} visitsPerPatient - Number of visits per patient
   * @returns {Promise<Object>} - Generated data
   */
  async generateAll(patientCount = 10, visitsPerPatient = 3) {
    try {
      // Generate patients
      const patients = await this.generatePatients(patientCount);
      
      // Generate visits for patients
      const visits = await this.generateVisits(patients, visitsPerPatient);
      
      return { patients, visits };
    } catch (error) {
      logger.error(`Error generating all mock data: ${error.message}`);
      throw error;
    }
  }
};

/**
 * Get random items from an array
 * @param {Array} array - Array to get items from
 * @param {number} count - Number of items to get
 * @returns {Array} - Random items
 */
function getRandomItems(array, count) {
  const result = [];
  const copy = [...array];
  
  count = Math.min(count, array.length);
  
  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy[index]);
    copy.splice(index, 1);
  }
  
  return result;
}

module.exports = mockData; 