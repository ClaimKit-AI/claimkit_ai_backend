/**
 * ClaimKit API Client
 * Frontend client for interacting with the ClaimKit API endpoints
 */

// ClaimKit API client 
const claimkitApi = {
  /**
   * Base URL for API requests
   */
  baseUrl: 'https://staging.claimkit.ai/ClaimkitAPI.php',
  
  /**
   * API key for ClaimKit API - will be set by the user
   */
  apiKey: '',
  
  /**
   * Hospital ID for ClaimKit API - will be set by the user
   */
  hospitalId: null,
  
  /**
   * Flag to track if API credentials are set
   */
  hasCredentials: false,
  
  /**
   * Default options for fetch requests
   */
  defaultOptions: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    credentials: 'omit' // Don't send cookies with cross-origin requests
  },
  
  /**
   * Initialize the API client with stored credentials if available
   */
  init() {
    // Try to load credentials from localStorage
    const storedApiKey = localStorage.getItem('claimkit_api_key');
    const storedHospitalId = localStorage.getItem('claimkit_hospital_id');
    
    if (storedApiKey && storedHospitalId) {
      this.setCredentials(storedApiKey, parseInt(storedHospitalId, 10));
      return true;
    }
    
    // No default values - fields should start empty
    this.apiKey = '';
    this.hospitalId = null;
    this.hasCredentials = false;
    return false;
  },
  
  /**
   * Set API credentials
   * @param {String} apiKey - API key
   * @param {Number} hospitalId - Hospital ID
   * @param {Boolean} saveToStorage - Whether to save credentials to localStorage
   * @returns {Boolean} - Success flag
   */
  setCredentials(apiKey, hospitalId, saveToStorage = false) {
    if (!apiKey || !hospitalId) {
      console.error('Invalid credentials');
      this.hasCredentials = false;
      return false;
    }
    
    this.apiKey = apiKey;
    this.hospitalId = parseInt(hospitalId, 10);
    this.hasCredentials = true;
    
    if (saveToStorage) {
      // Store credentials in localStorage
      localStorage.setItem('claimkit_api_key', apiKey);
      localStorage.setItem('claimkit_hospital_id', hospitalId);
    }
    
    return true;
  },
  
  /**
   * Clear API credentials
   */
  clearCredentials() {
    this.apiKey = '';
    this.hospitalId = null;
    this.hasCredentials = false;
    
    // Remove from localStorage
    localStorage.removeItem('claimkit_api_key');
    localStorage.removeItem('claimkit_hospital_id');
  },
  
  /**
   * Make a fetch request to the API
   * @param {Object} params - Request parameters
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - Response data
   */
  async fetchApi(params, options = {}) {
    const url = this.baseUrl;
    
    // Ensure we have credentials
    if (!this.apiKey || !this.hospitalId) {
      throw new Error('API credentials not set. Please enter your API key and hospital ID.');
    }
    
    const requestOptions = {
      method: 'POST',
      ...this.defaultOptions,
      ...options,
      headers: {
        ...this.defaultOptions.headers,
        ...options.headers
      },
      body: JSON.stringify(params)
    };
    
    try {
      const response = await fetch(url, requestOptions);
      
      // Parse response as JSON
      const data = await response.json();
      
      // Handle API errors
      if (!response.ok || data.status === 'error' || data.status === 'fail') {
        const errorMessage = data.message || `Error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed');
      throw error;
    }
  },
  
  /**
   * Review medical documentation for compliance issues
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>} - Review results
   */
  async reviewMedicalDocumentation(params) {
    const { 
      doctorNotes, 
      patientAge, 
      patientGender, 
      visitType,
      insurancePolicy 
    } = params;
    
    // Create a unique patient ID using timestamp and random numbers
    const patientId = `HP${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;
    
    // Create request payload
    const requestParams = {
      action: "review",
      hospital_id: this.hospitalId,
      claimkit_api_key: this.apiKey,
      hospital_patient_id: patientId,
      doctor_notes: doctorNotes,
      insurance_company: "ADNIC", // Default value
      policy_band: "Gold", // Default value
      policy_id: "17", // Default value
      patient_checkin_time: Math.floor(Date.now() / 1000),
      doctor_name: "Dr. MediVoice Assistant",
      doctor_specialization: "General Practitioner",
      hospital_doctor_id: "86",
      patient_history: []
    };
    
    return this.fetchApi(requestParams);
  },
  
  /**
   * Enhance doctor notes with structured information
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>} - Enhanced notes
   */
  async enhanceDoctorNotes(params) {
    const { requestId } = params;
    
    if (!requestId) {
      throw new Error('Request ID is required for enhancement');
    }
    
    // Create request payload
    const requestParams = {
      action: "enhance",
      hospital_id: this.hospitalId,
      claimkit_api_key: this.apiKey,
      request_id: requestId
    };
    
    return this.fetchApi(requestParams);
  },
  
  /**
   * Generate an insurance claim from doctor notes
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>} - Generated claim
   */
  async generateInsuranceClaim(params) {
    // This will be implemented later according to the user
    throw new Error('Insurance claim generation is not yet implemented');
  },
  
  /**
   * Handle claim denial by creating corrected claims
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>} - Corrected claim
   */
  async handleClaimDenial(params) {
    // This will be implemented later according to the user
    throw new Error('Claim denial management is not yet implemented');
  }
};

// Initialize the API client
claimkitApi.init();

// Expose claimkitApi to the global scope
window.claimkitApi = claimkitApi; 