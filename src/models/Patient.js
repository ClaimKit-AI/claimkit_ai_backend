const { db } = require('../config/firebase');
const logger = require('../utils/logger');

/**
 * Patient model for Firestore
 * Defines the structure and methods for patient data
 */
class Patient {
  /**
   * Collection name in Firestore
   */
  static collection = 'patients';
  
  /**
   * Find a patient by ID
   * @param {string} id - Patient ID
   * @returns {Promise<Object|null>} - Patient data or null if not found
   */
  static async findById(id) {
    try {
      const docRef = db.collection(this.collection).doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return null;
      }
      
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      logger.error(`Error finding patient by ID: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get all patients
   * @param {number} limit - Maximum number of patients to return
   * @returns {Promise<Array>} - Array of patients
   */
  static async findAll(limit = 100) {
    try {
      const patientsRef = db.collection(this.collection).limit(limit);
      const snapshot = await patientsRef.get();
      
      const patients = [];
      snapshot.forEach(doc => {
        patients.push({ id: doc.id, ...doc.data() });
      });
      
      return patients;
    } catch (error) {
      logger.error(`Error finding all patients: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create a new patient
   * @param {Object} data - Patient data
   * @returns {Promise<Object>} - Created patient
   */
  static async create(data) {
    try {
      // Validate required fields
      if (!data.firstName || !data.lastName) {
        throw new Error('First name and last name are required');
      }
      
      // Add created timestamp
      const patientData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Create document
      const docRef = await db.collection(this.collection).add(patientData);
      
      return { id: docRef.id, ...patientData };
    } catch (error) {
      logger.error(`Error creating patient: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update a patient
   * @param {string} id - Patient ID
   * @param {Object} data - Patient data to update
   * @returns {Promise<Object>} - Updated patient
   */
  static async update(id, data) {
    try {
      // Add updated timestamp
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      // Update document
      const docRef = db.collection(this.collection).doc(id);
      await docRef.update(updateData);
      
      // Get updated document
      const updatedDoc = await docRef.get();
      
      return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
      logger.error(`Error updating patient: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete a patient
   * @param {string} id - Patient ID
   * @returns {Promise<boolean>} - Success flag
   */
  static async delete(id) {
    try {
      await db.collection(this.collection).doc(id).delete();
      return true;
    } catch (error) {
      logger.error(`Error deleting patient: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get patient schema
   * @returns {Object} - Patient schema
   */
  static getSchema() {
    return {
      firstName: { type: 'string', required: true },
      lastName: { type: 'string', required: true },
      dateOfBirth: { type: 'date', required: true },
      gender: { type: 'string', enum: ['male', 'female', 'other'], required: true },
      contactInfo: {
        email: { type: 'string' },
        phone: { type: 'string' },
        address: { type: 'string' }
      },
      medicalHistory: {
        conditions: [{ type: 'string' }],
        allergies: [{ type: 'string' }],
        medications: [{ type: 'string' }],
        surgeries: [{ type: 'string' }]
      },
      insuranceInfo: {
        provider: { type: 'string' },
        policyNumber: { type: 'string' },
        groupNumber: { type: 'string' },
        coverage: { type: 'string' }
      }
    };
  }
}

module.exports = Patient; 