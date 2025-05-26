const { db } = require('../config/firebase');
const logger = require('../utils/logger');

/**
 * Visit model for Firestore
 * Defines the structure and methods for patient visit data
 */
class Visit {
  /**
   * Collection name in Firestore
   */
  static collection = 'visits';
  
  /**
   * Find a visit by ID
   * @param {string} id - Visit ID
   * @returns {Promise<Object|null>} - Visit data or null if not found
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
      logger.error(`Error finding visit by ID: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get all visits for a patient
   * @param {string} patientId - Patient ID
   * @param {number} limit - Maximum number of visits to return
   * @returns {Promise<Array>} - Array of visits
   */
  static async findByPatientId(patientId, limit = 100) {
    try {
      const visitsRef = db.collection(this.collection)
        .where('patientId', '==', patientId)
        .orderBy('visitDate', 'desc')
        .limit(limit);
      
      const snapshot = await visitsRef.get();
      
      const visits = [];
      snapshot.forEach(doc => {
        visits.push({ id: doc.id, ...doc.data() });
      });
      
      return visits;
    } catch (error) {
      logger.error(`Error finding visits for patient: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create a new visit
   * @param {Object} data - Visit data
   * @returns {Promise<Object>} - Created visit
   */
  static async create(data) {
    try {
      // Validate required fields
      if (!data.patientId || !data.visitDate || !data.visitType) {
        throw new Error('Patient ID, visit date, and visit type are required');
      }
      
      // Add created timestamp
      const visitData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Create document
      const docRef = await db.collection(this.collection).add(visitData);
      
      return { id: docRef.id, ...visitData };
    } catch (error) {
      logger.error(`Error creating visit: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update a visit
   * @param {string} id - Visit ID
   * @param {Object} data - Visit data to update
   * @returns {Promise<Object>} - Updated visit
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
      logger.error(`Error updating visit: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete a visit
   * @param {string} id - Visit ID
   * @returns {Promise<boolean>} - Success flag
   */
  static async delete(id) {
    try {
      await db.collection(this.collection).doc(id).delete();
      return true;
    } catch (error) {
      logger.error(`Error deleting visit: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get visit schema
   * @returns {Object} - Visit schema
   */
  static getSchema() {
    return {
      patientId: { type: 'string', required: true },
      visitDate: { type: 'date', required: true },
      visitType: { type: 'string', required: true },
      providerId: { type: 'string' },
      providerName: { type: 'string' },
      chiefComplaint: { type: 'string' },
      vitalSigns: {
        temperature: { type: 'number' },
        bloodPressure: { type: 'string' },
        heartRate: { type: 'number' },
        respiratoryRate: { type: 'number' },
        oxygenSaturation: { type: 'number' },
        height: { type: 'number' },
        weight: { type: 'number' },
        bmi: { type: 'number' }
      },
      diagnosis: [{
        code: { type: 'string' },
        description: { type: 'string' },
        isPrimary: { type: 'boolean' }
      }],
      procedures: [{
        code: { type: 'string' },
        description: { type: 'string' },
        notes: { type: 'string' }
      }],
      medications: [{
        name: { type: 'string' },
        dosage: { type: 'string' },
        frequency: { type: 'string' },
        instructions: { type: 'string' }
      }],
      notes: { type: 'string' },
      followUp: { type: 'string' }
    };
  }
}

module.exports = Visit; 