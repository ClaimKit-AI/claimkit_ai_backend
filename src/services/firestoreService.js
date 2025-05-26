const { db } = require('../config/firebase');
const logger = require('../utils/logger');

/**
 * Firestore service for travel report operations
 */

// Patients collection
const patientsCollection = 'patients';
const languagesCollection = 'languages';
const reportsCollection = 'reports';
const visitsCollection = 'visits';

// Get all patients
const getPatients = async () => {
  try {
    const patientsSnapshot = await db.collection(patientsCollection).get();
    const patients = [];
    
    patientsSnapshot.forEach(doc => {
      patients.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return patients;
  } catch (error) {
    logger.error(`Error getting patients from Firestore: ${error.message}`);
    throw error;
  }
};

// Get patient by ID
const getPatientById = async (patientId) => {
  try {
    const patientDoc = await db.collection(patientsCollection).doc(patientId).get();
    
    if (!patientDoc.exists) {
      throw new Error(`Patient with ID ${patientId} not found`);
    }
    
    return {
      id: patientDoc.id,
      ...patientDoc.data()
    };
  } catch (error) {
    logger.error(`Error getting patient from Firestore: ${error.message}`);
    throw error;
  }
};

// Get patient with eligibility status for generating a report
const getPatientWithEligibility = async (patientId) => {
  try {
    const patient = await getPatientById(patientId);
    
    // Check if patient has a lastVisitDate
    if (!patient.lastVisitDate) {
      // Get the most recent visit from the visits collection
      const visitsSnapshot = await db.collection(visitsCollection)
        .where('patientId', '==', patientId)
        .orderBy('date', 'desc')
        .limit(1)
        .get();
      
      if (visitsSnapshot.empty) {
        // No visits found
        patient.isEligibleForReport = false;
        patient.eligibilityReason = 'No visits found for this patient';
        return patient;
      }
      
      // Get the most recent visit date
      const mostRecentVisit = visitsSnapshot.docs[0].data();
      patient.lastVisitDate = mostRecentVisit.date;
      
      // Update the patient record with the lastVisitDate for future use
      await db.collection(patientsCollection).doc(patientId).update({
        lastVisitDate: mostRecentVisit.date
      });
    }
    
    // Convert Firebase timestamp to Date if needed
    const lastVisitDate = patient.lastVisitDate instanceof Date ? 
      patient.lastVisitDate : 
      new Date(patient.lastVisitDate._seconds * 1000);
    
    // Check if the last visit was within 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const isEligible = lastVisitDate >= sixMonthsAgo;
    
    // Add eligibility information to the patient
    patient.isEligibleForReport = isEligible;
    patient.eligibilityReason = isEligible ? 
      'Patient has visited within the last 6 months' : 
      'Patient has not visited within the last 6 months';
    patient.lastVisitFormatted = lastVisitDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    return patient;
  } catch (error) {
    logger.error(`Error checking patient eligibility: ${error.message}`);
    throw error;
  }
};

// Get all supported languages
const getLanguages = async () => {
  try {
    const languagesSnapshot = await db.collection(languagesCollection).get();
    const languages = [];
    
    languagesSnapshot.forEach(doc => {
      languages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return languages;
  } catch (error) {
    logger.error(`Error getting languages from Firestore: ${error.message}`);
    throw error;
  }
};

// Save a generated report
const saveReport = async (report) => {
  try {
    // Check if patient is eligible for a report
    const patient = await getPatientWithEligibility(report.patientId);
    
    if (!patient.isEligibleForReport) {
      throw new Error(`Cannot generate report: ${patient.eligibilityReason}`);
    }
    
    const reportRef = await db.collection(reportsCollection).add({
      ...report,
      createdAt: new Date()
    });
    
    return {
      id: reportRef.id,
      ...report
    };
  } catch (error) {
    logger.error(`Error saving report to Firestore: ${error.message}`);
    throw error;
  }
};

// Get reports for a patient
const getPatientReports = async (patientId) => {
  try {
    const reportsSnapshot = await db.collection(reportsCollection)
      .where('patientId', '==', patientId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const reports = [];
    
    reportsSnapshot.forEach(doc => {
      reports.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return reports;
  } catch (error) {
    logger.error(`Error getting patient reports from Firestore: ${error.message}`);
    throw error;
  }
};

// Get patient visits
const getPatientVisits = async (patientId) => {
  try {
    const visitsSnapshot = await db.collection(visitsCollection)
      .where('patientId', '==', patientId)
      .orderBy('date', 'desc')
      .get();
    
    const visits = [];
    
    visitsSnapshot.forEach(doc => {
      visits.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return visits;
  } catch (error) {
    logger.error(`Error getting patient visits from Firestore: ${error.message}`);
    throw error;
  }
};

// Seed initial data if collections are empty
const seedInitialData = async () => {
  try {
    // Check if patients collection is empty
    const patientsSnapshot = await db.collection(patientsCollection).limit(1).get();
    
    if (patientsSnapshot.empty) {
      logger.info('Seeding patients collection...');
      
      const mockPatients = [
        { name: 'James Wilson', age: 42, gender: 'male', medicalHistory: ['Hypertension', 'Type 2 Diabetes'] },
        { name: 'Maria Garcia', age: 35, gender: 'female', medicalHistory: ['Asthma', 'Seasonal allergies'] },
        { name: 'Robert Chen', age: 68, gender: 'male', medicalHistory: ['Coronary artery disease', 'Osteoarthritis'] },
        { name: 'Sarah Johnson', age: 29, gender: 'female', medicalHistory: ['Anxiety disorder', 'Migraines'] },
        { name: 'Michael Thompson', age: 57, gender: 'male', medicalHistory: ['Hyperlipidemia', 'GERD'] }
      ];
      
      const batch = db.batch();
      
      mockPatients.forEach(patient => {
        const patientRef = db.collection(patientsCollection).doc();
        batch.set(patientRef, patient);
      });
      
      await batch.commit();
      logger.info('Patients collection seeded successfully');
    }
    
    // Check if languages collection is empty
    const languagesSnapshot = await db.collection(languagesCollection).limit(1).get();
    
    if (languagesSnapshot.empty) {
      logger.info('Seeding languages collection...');
      
      const mockLanguages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' }
      ];
      
      const batch = db.batch();
      
      mockLanguages.forEach(language => {
        const languageRef = db.collection(languagesCollection).doc(language.code);
        batch.set(languageRef, language);
      });
      
      await batch.commit();
      logger.info('Languages collection seeded successfully');
    }
  } catch (error) {
    logger.error(`Error seeding initial data: ${error.message}`);
  }
};

module.exports = {
  getPatients,
  getPatientById,
  getPatientWithEligibility,
  getLanguages,
  saveReport,
  getPatientReports,
  getPatientVisits,
  seedInitialData
}; 