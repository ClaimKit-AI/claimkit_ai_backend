/**
 * ClaimKit Integration
 * Handles the integration with ClaimKit API endpoints
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize ClaimKit integration
    initClaimKitIntegration();
});

/**
 * Initialize ClaimKit integration UI and event handlers
 */
function initClaimKitIntegration() {
    // Removed detailed log
    
    // Get DOM elements
    const enhanceNotesBtn = document.getElementById('enhanceNotesBtn');
    const reviewDocumentationBtn = document.getElementById('reviewDocumentationBtn');
    const generateInsuranceClaimBtn = document.getElementById('generateInsuranceClaimBtn');
    const handleDenialBtn = document.getElementById('handleDenialBtn');
    const submitButton = document.getElementById('submitButton');
    
    // API Credentials elements
    const apiKeyInput = document.getElementById('apiKeyInput');
    const hospitalIdInput = document.getElementById('hospitalIdInput');
    const toggleApiKeyBtn = document.getElementById('toggleApiKey');
    const saveCredentialsBtn = document.getElementById('saveCredentialsBtn');
    const credentialsStatus = document.getElementById('credentialsStatus');
    const activeHospitalId = document.getElementById('activeHospitalId');
    const apiCredentialsActive = document.querySelector('.api-credentials-active');
    
    // Do not prefill credential fields, even if values are available
    // Instead, just update the credential status indicator
    updateCredentialStatus();
    
    // Tabs
    const claimkitTabButtons = document.querySelectorAll('.claimkit-tab-button');
    const claimkitTabPanes = document.querySelectorAll('.claimkit-tab-pane');
    
    // Results displays
    const enhancedNotesDisplay = document.getElementById('enhancedNotesDisplay');
    const reviewResultsDisplay = document.getElementById('reviewResultsDisplay');
    const insuranceClaimDisplay = document.getElementById('insuranceClaimDisplay');
    const denialCorrectionDisplay = document.getElementById('denialCorrectionDisplay');
    const denialReason = document.getElementById('denialReason');
    
    // Main app tabs
    const claimkitTabButton = document.querySelector('.tab-button[data-tab="claimkit"]');
    
    // Initially disable enhance notes button - it should only be enabled after review
    if (enhanceNotesBtn) {
        enhanceNotesBtn.disabled = true;
        enhanceNotesBtn.classList.add('disabled');
    }

    // Initially disable claim generation button - it should only be enabled after enhancement
    if (generateInsuranceClaimBtn) {
        generateInsuranceClaimBtn.disabled = true;
        generateInsuranceClaimBtn.classList.add('disabled');
    }
    
    // Override the submit button click handler to check for credentials
    if (submitButton) {
        const originalSubmitClickHandler = submitButton.onclick;
        submitButton.onclick = function(event) {
            // Check if credentials are set
            if (!window.claimkitApi.apiKey || !window.claimkitApi.hospitalId) {
                event.preventDefault();
                event.stopPropagation();
                showGlobalNotification('Please enter and save your API credentials before submitting', 'error');
                
                // Scroll to credentials panel
                document.querySelector('.main-credentials').scrollIntoView({ behavior: 'smooth' });
                return false;
            }
            
            // Call the original handler if credentials are set
            if (typeof originalSubmitClickHandler === 'function') {
                return originalSubmitClickHandler.call(this, event);
            }
        };
    }
    
    // Add event listeners for tab switching
    claimkitTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Set active tab button
            claimkitTabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show active tab pane
            const tabName = button.getAttribute('data-tab');
            claimkitTabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === tabName) {
                    pane.classList.add('active');
                }
            });
        });
    });
    
    // Add event listener for API key toggle visibility
    if (toggleApiKeyBtn) {
        toggleApiKeyBtn.addEventListener('click', () => {
            const inputType = apiKeyInput.type;
            apiKeyInput.type = inputType === 'password' ? 'text' : 'password';
            
            // Toggle icon
            const icon = toggleApiKeyBtn.querySelector('i');
            if (icon) {
                icon.className = inputType === 'password' ? 'fas fa-eye-slash' : 'fas fa-eye';
            }
        });
    }
    
    // Add event listener for saving credentials
    if (saveCredentialsBtn) {
        saveCredentialsBtn.addEventListener('click', () => {
            saveApiCredentials();
        });
    }
    
    // Add event listeners for action buttons
    if (enhanceNotesBtn) {
        enhanceNotesBtn.addEventListener('click', handleEnhanceNotes);
    }
    
    if (reviewDocumentationBtn) {
        reviewDocumentationBtn.addEventListener('click', handleReviewDocumentation);
    }
    
    if (generateInsuranceClaimBtn) {
        generateInsuranceClaimBtn.addEventListener('click', handleGenerateInsuranceClaim);
    }
    
    if (handleDenialBtn) {
        handleDenialBtn.addEventListener('click', handleClaimDenial);
    }
    
    // Expose functions to window object
    window.handleReviewDocumentation = handleReviewDocumentation;
    window.handleEnhanceNotes = handleEnhanceNotes;
    window.handleGenerateInsuranceClaim = handleGenerateInsuranceClaim;
    window.handleClaimDenial = handleClaimDenial;
    
    /**
     * Save API credentials from form
     */
    function saveApiCredentials() {
        const apiKey = apiKeyInput.value.trim();
        const hospitalId = hospitalIdInput.value.trim();
        
        if (!apiKey) {
            showCredentialStatus('API Key is required', 'error');
            return;
        }
        
        if (!hospitalId) {
            showCredentialStatus('Hospital ID is required', 'error');
            return;
        }
        
        // Set the credentials
        const success = window.claimkitApi.setCredentials(apiKey, hospitalId, true);
        
        if (success) {
            showCredentialStatus('Credentials saved successfully', 'success');
            updateCredentialStatus();
            
            // Show global notification
            showGlobalNotification('API credentials saved successfully', 'success');
        } else {
            showCredentialStatus('Invalid credentials', 'error');
        }
    }
    
    /**
     * Show global notification in the status bar
     * @param {String} message - Notification message
     * @param {String} type - Notification type (success, error, warning)
     */
    function showGlobalNotification(message, type = 'info') {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = 'status';
            statusElement.classList.add(type);
            
            setTimeout(() => {
                statusElement.textContent = 'Ready';
                statusElement.className = 'status';
            }, 5000);
        }
    }
    
    /**
     * Show credential status message
     * @param {String} message - Status message
     * @param {String} type - Status type (success, error, warning)
     */
    function showCredentialStatus(message, type = 'info') {
        if (credentialsStatus) {
            credentialsStatus.textContent = message;
            credentialsStatus.className = 'credentials-status';
            credentialsStatus.classList.add(type);
            
            // Clear after 3 seconds
            setTimeout(() => {
                credentialsStatus.textContent = '';
                credentialsStatus.className = 'credentials-status';
            }, 3000);
        }
    }
    
    /**
     * Update credential status indicator
     */
    function updateCredentialStatus() {
        if (apiCredentialsActive && activeHospitalId) {
            if (window.claimkitApi.apiKey && window.claimkitApi.hospitalId) {
                activeHospitalId.textContent = window.claimkitApi.hospitalId;
                apiCredentialsActive.style.display = 'flex';
            } else {
                apiCredentialsActive.style.display = 'none';
            }
        }
        
        // Update status on claimkit tab if it exists
        let tabStatusIndicator = document.querySelector('.claimkit-actions .api-credentials-active');
        const claimkitActions = document.querySelector('.claimkit-actions');
        
        if (!tabStatusIndicator && claimkitActions) {
            tabStatusIndicator = document.createElement('div');
            tabStatusIndicator.className = 'api-credentials-active';
            claimkitActions.parentNode.insertBefore(tabStatusIndicator, claimkitActions);
        }
        
        if (tabStatusIndicator) {
            if (window.claimkitApi.apiKey && window.claimkitApi.hospitalId) {
                tabStatusIndicator.innerHTML = `<i class="fas fa-check-circle"></i> Using API key for Hospital ID: ${window.claimkitApi.hospitalId}`;
                tabStatusIndicator.style.display = 'flex';
            } else {
                tabStatusIndicator.style.display = 'none';
            }
        }
    }
}

// Store last review request ID for enhancement
let lastReviewRequestId = null;

/**
 * Handle enhancing doctor notes
 */
async function handleEnhanceNotes() {
    if (!lastReviewRequestId) {
        showNotification('You must review the notes first before enhancing them.', 'error');
        return;
    }
    
    // Show loading status
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingStatus = document.getElementById('loadingStatus');
    loadingOverlay.classList.add('active');
    loadingStatus.textContent = 'Enhancing doctor notes...';
    
    try {
        // Prepare request parameters
        const params = {
            requestId: lastReviewRequestId
        };
        
        // Removed detailed log with request ID
        
        // Call the API
        const result = await window.claimkitApi.enhanceDoctorNotes(params);
        
        // Display the enhanced notes
        const enhancedNotesDisplay = document.getElementById('enhancedNotesDisplay');
        
        if (result && result.status === 'success' && result.data) {
            // Check if we have the expected structure
            const enhancedData = result.data.enhanced_notes;
            
            if (enhancedData) {
                // Format enhanced notes for display
                const formattedNotes = formatEnhancedNotes(enhancedData);
                enhancedNotesDisplay.innerHTML = formattedNotes;
                
                // Switch to ClaimKit tab and enhanced notes subtab
                switchToClaimKitTab('enhanced-notes');
                
                // Enable insurance claim generation after successful enhancement
                const generateInsuranceClaimBtn = document.getElementById('generateInsuranceClaimBtn');
                if (generateInsuranceClaimBtn) {
                    generateInsuranceClaimBtn.disabled = false;
                    generateInsuranceClaimBtn.classList.remove('disabled');
                }
                
                // Also populate the EMR interface with the enhanced data
                populateEMRFromEnhancedNotes(enhancedData);
                
                showNotification('Doctor notes enhanced successfully.', 'success');
            } else {
                enhancedNotesDisplay.innerHTML = `<p>Error: Invalid response format from server.</p>`;
                showNotification('Failed to parse enhanced notes.', 'error');
            }
        } else {
            enhancedNotesDisplay.innerHTML = `<p>Error: ${result.message || 'Failed to enhance doctor notes.'}</p>`;
            showNotification('Failed to enhance doctor notes.', 'error');
        }
    } catch (error) {
        console.error('Error enhancing doctor notes');
        document.getElementById('enhancedNotesDisplay').innerHTML = `<p>Error: ${error.message}</p>`;
        showNotification('Error enhancing doctor notes: ' + error.message, 'error');
    } finally {
        // Hide loading overlay
        loadingOverlay.classList.remove('active');
    }
}

/**
 * Populate the EMR interface from the enhanced notes data
 */
function populateEMRFromEnhancedNotes(enhancedData) {
    try {
        // Removed detailed log with potentially sensitive patient data
        
        const emrChiefComplaint = document.getElementById('emrChiefComplaint');
        const emrHPI = document.getElementById('emrHPI');
        const emrSecondaryComplaints = document.getElementById('emrSecondaryComplaints');
        const emrConditions = document.getElementById('emrConditions');
        const emrSurgeries = document.getElementById('emrSurgeries');
        const emrAllergies = document.getElementById('emrAllergies');
        
        // Set patient info
        const emrPatientAge = document.getElementById('emrPatientAge');
        const emrPatientGender = document.getElementById('emrPatientGender');
        const emrVisitType = document.getElementById('emrVisitType');
        
        if (emrPatientAge) emrPatientAge.textContent = document.getElementById('patientAge').value + ' years';
        if (emrPatientGender) emrPatientGender.textContent = document.getElementById('patientGender').value;
        if (emrVisitType) emrVisitType.textContent = document.getElementById('visitType').value;
        
        if (typeof enhancedData === 'object') {
            // Extract data from sections object
            if (enhancedData.sections) {
                // Chief complaint
                if (enhancedData.sections.chief_complaint && emrChiefComplaint) {
                    emrChiefComplaint.value = enhancedData.sections.chief_complaint;
                }
                
                // History of present illness
                if (enhancedData.sections.history_of_present_illness && emrHPI) {
                    emrHPI.value = enhancedData.sections.history_of_present_illness;
                }
                
                // Secondary complaints
                if (enhancedData.sections.secondary_complaints && emrSecondaryComplaints) {
                    if (Array.isArray(enhancedData.sections.secondary_complaints)) {
                        emrSecondaryComplaints.value = enhancedData.sections.secondary_complaints.join('\n');
                    } else {
                        emrSecondaryComplaints.value = enhancedData.sections.secondary_complaints;
                    }
                }
                
                // Past medical history
                if (enhancedData.sections.past_medical_history) {
                    const pmh = enhancedData.sections.past_medical_history;
                    
                    // Medical conditions
                    if (pmh.conditions && emrConditions) {
                        if (Array.isArray(pmh.conditions)) {
                            emrConditions.value = pmh.conditions.join('\n');
                        } else {
                            emrConditions.value = pmh.conditions;
                        }
                    }
                    
                    // Surgeries
                    if (pmh.surgeries && emrSurgeries) {
                        if (Array.isArray(pmh.surgeries)) {
                            emrSurgeries.value = pmh.surgeries.join('\n');
                        } else {
                            emrSurgeries.value = pmh.surgeries;
                        }
                    }
                }
                
                // Allergies
                if (enhancedData.sections.allergies && emrAllergies) {
                    if (Array.isArray(enhancedData.sections.allergies)) {
                        emrAllergies.value = enhancedData.sections.allergies.join('\n');
                    } else {
                        emrAllergies.value = enhancedData.sections.allergies;
                    }
                }
                
                // Vital signs
                populateVitalSigns(enhancedData.sections.vital_signs);
                
                // Assessments (diagnoses)
                populateAssessments(enhancedData.sections.diagnoses);
                
                // Medications
                populateMedications(enhancedData.sections.medications);
                
                // Treatment plan
                populateTreatmentPlan(enhancedData.sections.treatment_plan);
                
                // Follow-up
                populateFollowUp(enhancedData.sections.follow_up);
            }
        }
        
        // Show the results section
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.classList.remove('hidden');
        }
        
    } catch (error) {
        console.error('Error populating EMR from enhanced notes');
    }
}

/**
 * Populate vital signs in the EMR interface
 */
function populateVitalSigns(vitalSigns) {
    if (!vitalSigns) return;
    
    const emrBP = document.getElementById('emrBP');
    const emrHR = document.getElementById('emrHR');
    const emrRR = document.getElementById('emrRR');
    const emrTemp = document.getElementById('emrTemp');
    const emrO2 = document.getElementById('emrO2');
    const emrHeight = document.getElementById('emrHeight');
    const emrWeight = document.getElementById('emrWeight');
    const emrBMI = document.getElementById('emrBMI');
    
    if (emrBP && vitalSigns.blood_pressure) emrBP.value = vitalSigns.blood_pressure;
    if (emrHR && vitalSigns.heart_rate) emrHR.value = vitalSigns.heart_rate;
    if (emrRR && vitalSigns.respiratory_rate) emrRR.value = vitalSigns.respiratory_rate;
    if (emrTemp && vitalSigns.temperature) emrTemp.value = vitalSigns.temperature;
    if (emrO2 && vitalSigns.oxygen_saturation) emrO2.value = vitalSigns.oxygen_saturation;
    if (emrHeight && vitalSigns.height) emrHeight.value = vitalSigns.height;
    if (emrWeight && vitalSigns.weight) emrWeight.value = vitalSigns.weight;
    if (emrBMI && vitalSigns.bmi) emrBMI.value = vitalSigns.bmi;
}

/**
 * Populate assessments in the EMR interface
 */
function populateAssessments(diagnoses) {
    if (!diagnoses || !Array.isArray(diagnoses)) return;
    
    const emrAssessmentsContainer = document.getElementById('emrAssessmentsContainer');
    if (!emrAssessmentsContainer) return;
    
    // Clear existing content
    emrAssessmentsContainer.innerHTML = '';
    
    // Add each diagnosis as an assessment
    diagnoses.forEach(diagnosis => {
        const assessmentItem = document.createElement('div');
        assessmentItem.className = 'assessment-form-item';
        
        assessmentItem.innerHTML = `
            <div class="assessment-form-row">
                <input type="text" class="diagnosis-input" placeholder="Diagnosis" value="${diagnosis.name || ''}">
                <input type="text" class="icd-input" placeholder="ICD Code" value="${diagnosis.code || ''}">
            </div>
            <textarea class="evidence-input" placeholder="Clinical evidence">${diagnosis.evidence || ''}</textarea>
            <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
        `;
        
        emrAssessmentsContainer.appendChild(assessmentItem);
    });
    
    // If no diagnoses were added, add an empty form
    if (diagnoses.length === 0) {
        const assessmentItem = document.createElement('div');
        assessmentItem.className = 'assessment-form-item';
        
        assessmentItem.innerHTML = `
            <div class="assessment-form-row">
                <input type="text" class="diagnosis-input" placeholder="Diagnosis">
                <input type="text" class="icd-input" placeholder="ICD Code">
            </div>
            <textarea class="evidence-input" placeholder="Clinical evidence"></textarea>
            <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
        `;
        
        emrAssessmentsContainer.appendChild(assessmentItem);
    }
}

/**
 * Populate medications in the EMR interface
 */
function populateMedications(medications) {
    if (!medications || !Array.isArray(medications)) return;
    
    const emrPrescribedMedsContainer = document.getElementById('emrPrescribedMedsContainer');
    if (!emrPrescribedMedsContainer) return;
    
    // Clear existing content
    emrPrescribedMedsContainer.innerHTML = '';
    
    // Add each medication
    medications.forEach(med => {
        const medItem = document.createElement('div');
        medItem.className = 'medication-form-item';
        
        medItem.innerHTML = `
            <input type="text" class="med-name" placeholder="Medication name" value="${med.name || ''}">
            <div class="med-details">
                <input type="text" class="med-dosage" placeholder="Dosage" value="${med.dosage || ''}">
                <input type="text" class="med-frequency" placeholder="Frequency" value="${med.frequency || ''}">
                <input type="text" class="med-duration" placeholder="Duration" value="${med.duration || ''}">
            </div>
            <textarea class="med-instructions" placeholder="Instructions">${med.instructions || ''}</textarea>
            <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
        `;
        
        emrPrescribedMedsContainer.appendChild(medItem);
    });
    
    // If no medications were added, add an empty form
    if (medications.length === 0) {
        const medItem = document.createElement('div');
        medItem.className = 'medication-form-item';
        
        medItem.innerHTML = `
            <input type="text" class="med-name" placeholder="Medication name">
            <div class="med-details">
                <input type="text" class="med-dosage" placeholder="Dosage">
                <input type="text" class="med-frequency" placeholder="Frequency">
                <input type="text" class="med-duration" placeholder="Duration">
            </div>
            <textarea class="med-instructions" placeholder="Instructions"></textarea>
            <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
        `;
        
        emrPrescribedMedsContainer.appendChild(medItem);
    }
}

/**
 * Populate treatment plan in the EMR interface
 */
function populateTreatmentPlan(treatments) {
    if (!treatments || !Array.isArray(treatments)) return;
    
    const emrPrescribedTreatmentsContainer = document.getElementById('emrPrescribedTreatmentsContainer');
    if (!emrPrescribedTreatmentsContainer) return;
    
    // Clear existing content
    emrPrescribedTreatmentsContainer.innerHTML = '';
    
    // Add each treatment
    treatments.forEach(treatment => {
        const treatmentItem = document.createElement('div');
        treatmentItem.className = 'treatment-form-item';
        
        treatmentItem.innerHTML = `
            <input type="text" class="treatment-name" placeholder="Treatment" value="${treatment.name || ''}">
            <textarea class="treatment-instructions" placeholder="Instructions">${treatment.instructions || ''}</textarea>
            <input type="text" class="treatment-duration" placeholder="Duration" value="${treatment.duration || ''}">
            <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
        `;
        
        emrPrescribedTreatmentsContainer.appendChild(treatmentItem);
    });
    
    // If no treatments were added, add an empty form
    if (treatments.length === 0) {
        const treatmentItem = document.createElement('div');
        treatmentItem.className = 'treatment-form-item';
        
        treatmentItem.innerHTML = `
            <input type="text" class="treatment-name" placeholder="Treatment">
            <textarea class="treatment-instructions" placeholder="Instructions"></textarea>
            <input type="text" class="treatment-duration" placeholder="Duration">
            <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
        `;
        
        emrPrescribedTreatmentsContainer.appendChild(treatmentItem);
    }
}

/**
 * Populate follow-up information in the EMR interface
 */
function populateFollowUp(followUp) {
    if (!followUp) return;
    
    const emrFollowUpTiming = document.getElementById('emrFollowUpTiming');
    const emrFollowUpInstructions = document.getElementById('emrFollowUpInstructions');
    const emrReferralsContainer = document.getElementById('emrReferralsContainer');
    
    if (emrFollowUpTiming && followUp.timing) emrFollowUpTiming.value = followUp.timing;
    if (emrFollowUpInstructions && followUp.instructions) emrFollowUpInstructions.value = followUp.instructions;
    
    // Populate referrals
    if (emrReferralsContainer && followUp.referrals && Array.isArray(followUp.referrals)) {
        // Clear existing content
        emrReferralsContainer.innerHTML = '';
        
        // Add each referral
        followUp.referrals.forEach(referral => {
            const referralItem = document.createElement('div');
            referralItem.className = 'referral-form-item';
            
            referralItem.innerHTML = `
                <input type="text" class="referral-speciality" placeholder="Speciality" value="${referral.speciality || ''}">
                <input type="text" class="referral-reason" placeholder="Reason" value="${referral.reason || ''}">
                <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
            `;
            
            emrReferralsContainer.appendChild(referralItem);
        });
        
        // If no referrals were added, add an empty form
        if (followUp.referrals.length === 0) {
            const referralItem = document.createElement('div');
            referralItem.className = 'referral-form-item';
            
            referralItem.innerHTML = `
                <input type="text" class="referral-speciality" placeholder="Speciality">
                <input type="text" class="referral-reason" placeholder="Reason">
                <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
            `;
            
            emrReferralsContainer.appendChild(referralItem);
        }
    }
}

/**
 * Format enhanced notes object into readable EMR-like UI
 * @param {Object} enhancedData - Enhanced notes data from API
 * @returns {String} - Formatted HTML for display
 */
function formatEnhancedNotes(enhancedData) {
    if (!enhancedData) {
        return `<div class="emr-section">
            <div class="emr-section-header bg-warning">No Data Available</div>
            <div class="emr-section-content">
                <p class="empty-state-message">No enhanced data is currently available. Please generate enhanced notes first.</p>
            </div>
        </div>`;
    }
    
    try {
        // If it's already a string, parse it
        if (typeof enhancedData === 'string') {
            try {
                enhancedData = JSON.parse(enhancedData);
            } catch (e) {
                return `<pre>${enhancedData}</pre>`;
            }
        }
        
        // Start building the formatted output
        let html = '<div class="emr-notes-container">';
        
        // Add title if available
        if (enhancedData.title) {
            html += `<h3 class="emr-title">${enhancedData.title}</h3>`;
        }
        
        // Process sections
        if (enhancedData.sections) {
            const sections = enhancedData.sections;
            
            // Loop through each section
            for (const [sectionKey, sectionData] of Object.entries(sections)) {
                // Skip empty sections
                if (!sectionData) continue;
                
                // Format section title
                const sectionTitle = sectionData.title || sectionKey
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                
                // Get section style if available
                const sectionStyle = sectionData.style || 'bg-primary';
                
                // Start section
                html += `<div class="emr-section">`;
                html += `<div class="emr-section-header ${sectionStyle}">${sectionTitle}</div>`;
                html += `<div class="emr-section-content">`;
                
                // Handle different section types
                if (sectionKey === 'patient_information' && sectionData.fields) {
                    // Patient information fields
                    for (const [fieldKey, fieldValue] of Object.entries(sectionData.fields)) {
                        const fieldLabel = fieldKey
                            .split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                        
                        html += `<div class="emr-field">
                            <div class="emr-field-label">${fieldLabel}</div>
                            <div class="emr-field-value">${fieldValue}</div>
                        </div>`;
                    }
                } else if (sectionKey === 'doctors_visit_notes' && sectionData.subsections) {
                    // Doctor's visit notes with subsections
                    for (const [subsectionKey, subsectionData] of Object.entries(sectionData.subsections)) {
                        const subsectionTitle = subsectionData.title || subsectionKey
                            .split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                        
                        html += `<div class="emr-subsection">
                            <div class="emr-subsection-title">${subsectionTitle}</div>`;
                        
                        // Handle different subsection types
                        if (subsectionKey === 'vitals' && subsectionData.fields) {
                            // Vitals as fields
                            for (const [fieldKey, fieldValue] of Object.entries(subsectionData.fields)) {
                                const fieldLabel = fieldKey
                                    .split('_')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' ');
                                
                                html += `<div class="emr-field">
                                    <div class="emr-field-label">${fieldLabel}</div>
                                    <div class="emr-field-value">${fieldValue}</div>
                                </div>`;
                            }
                        } else if (subsectionKey === 'diagnosis' && Array.isArray(subsectionData.items)) {
                            // Diagnosis items
                            subsectionData.items.forEach(item => {
                                html += `<div class="emr-diagnosis-item">
                                    <div class="emr-diagnosis-name">${item.name}</div>
                                    <div class="emr-diagnosis-code">${item.icd_10_cm_code}</div>
                                </div>`;
                            });
                        } else if (Array.isArray(subsectionData.items)) {
                            // General list items
                            html += `<ul class="emr-list">`;
                            subsectionData.items.forEach(item => {
                                if (typeof item === 'object') {
                                    html += `<li>${JSON.stringify(item)}</li>`;
                                } else {
                                    html += `<li>${item}</li>`;
                                }
                            });
                            html += `</ul>`;
                        } else if (typeof subsectionData === 'object') {
                            // Other object data
                            for (const [key, value] of Object.entries(subsectionData)) {
                                if (key !== 'title') {
                                    const fieldName = key
                                        .split('_')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ');
                                    
                                    if (typeof value === 'object') {
                                        html += `<div class="emr-field">
                                            <div class="emr-field-label">${fieldName}</div>
                                            <div class="emr-field-value">${JSON.stringify(value)}</div>
                                        </div>`;
                                    } else {
                                        html += `<div class="emr-field">
                                            <div class="emr-field-label">${fieldName}</div>
                                            <div class="emr-field-value">${value}</div>
                                        </div>`;
                                    }
                                }
                            }
                        }
                        
                        html += `</div>`;
                    }
                } else if (sectionKey === 'medications' && Array.isArray(sectionData)) {
                    // Medications as array
                    sectionData.forEach(med => {
                        if (med.name !== 'Unavailable') {
                            html += `<div class="emr-medication-item">
                                <div class="emr-medication-header">
                                    <div class="emr-medication-name">${med.name}</div>
                                    <div class="emr-medication-code">${med.medication_code}</div>
                                </div>
                                <div class="emr-medication-details">
                                    <div class="emr-medication-detail">Dosage: ${med.dosage}</div>
                                    <div class="emr-medication-detail">Frequency: ${med.frequency}</div>
                                    <div class="emr-medication-detail">Duration: ${med.duration}</div>
                                </div>
                                <div class="emr-medication-description">${med.description}</div>
                            </div>`;
                        }
                    });
                } else if (sectionKey === 'other_conditions' && Array.isArray(sectionData.conditions)) {
                    // Other conditions
                    sectionData.conditions.forEach(condition => {
                        html += `<div class="emr-condition-item">
                            <div class="emr-condition-title">${condition.title}</div>
                            <div class="emr-condition-description">${condition.description}</div>
                        </div>`;
                    });
                } else if (sectionKey === 'requested_procedure' && Array.isArray(sectionData.procedures)) {
                    // Requested procedures
                    sectionData.procedures.forEach(procedure => {
                        html += `<div class="emr-procedure-item">
                            <div class="emr-procedure-name">${procedure.name}</div>
                            <div class="emr-procedure-code">${procedure.cpt_code}</div>
                        </div>`;
                    });
                } else if (Array.isArray(sectionData)) {
                    // Generic array content
                    html += `<ul class="emr-list">`;
                    sectionData.forEach(item => {
                        if (typeof item === 'object') {
                            html += `<li>${JSON.stringify(item)}</li>`;
                        } else {
                            html += `<li>${item}</li>`;
                        }
                    });
                    html += `</ul>`;
                } else if (typeof sectionData === 'object') {
                    // Generic object content
                    for (const [key, value] of Object.entries(sectionData)) {
                        if (key !== 'title' && key !== 'style') {
                            const fieldName = key
                                .split('_')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ');
                            
                            if (typeof value === 'object' && !Array.isArray(value)) {
                                html += `<div class="emr-field">
                                    <div class="emr-field-label">${fieldName}</div>
                                    <div class="emr-field-value">${JSON.stringify(value)}</div>
                                </div>`;
                            } else if (Array.isArray(value)) {
                                html += `<div class="emr-field">
                                    <div class="emr-field-label">${fieldName}</div>
                                    <div class="emr-field-value">
                                        <ul class="emr-list">`;
                                
                                value.forEach(item => {
                                    if (typeof item === 'object') {
                                        html += `<li>${JSON.stringify(item)}</li>`;
                                    } else {
                                        html += `<li>${item}</li>`;
                                    }
                                });
                                
                                html += `</ul>
                                    </div>
                                </div>`;
                            } else {
                                html += `<div class="emr-field">
                                    <div class="emr-field-label">${fieldName}</div>
                                    <div class="emr-field-value">${value}</div>
                                </div>`;
                            }
                        }
                    }
                }
                
                html += `</div></div>`;
            }
        } else {
            // Fallback if no sections
            html += `<div class="emr-section">
                <div class="emr-section-header">Enhanced Notes</div>
                <div class="emr-section-content">
                    <pre>${JSON.stringify(enhancedData, null, 2)}</pre>
                </div>
            </div>`;
        }
        
        html += '</div>';
        return html;
    } catch (error) {
        console.error('Error formatting enhanced notes');
        return `<div class="emr-section">
            <div class="emr-section-header bg-error">Error Formatting Data</div>
            <div class="emr-section-content">
                <div class="error-container">
                    <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
                    <div class="error-details">
                        <p class="error-message">There was an error formatting the enhanced notes: ${error.message}</p>
                        <div class="error-data">
                            <h4>Raw Data:</h4>
                            <pre>${JSON.stringify(enhancedData, null, 2)}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }
}

/**
 * Handle reviewing medical documentation
 */
async function handleReviewDocumentation() {
    // Get current notes text (try to get from formatted note, or transcription)
    let doctorNotes = '';
    const formattedNote = document.getElementById('formattedNote');
    const transcriptionDisplay = document.getElementById('transcriptionDisplay');
    
    if (formattedNote && formattedNote.textContent.trim()) {
        doctorNotes = formattedNote.textContent.trim();
    } else if (transcriptionDisplay && transcriptionDisplay.textContent.trim()) {
        doctorNotes = transcriptionDisplay.textContent.trim();
    } else {
        showNotification('No notes available to review. Please record or transcribe notes first.', 'error');
        return;
    }
    
    // Get patient information
    const patientAge = document.getElementById('patientAge').value || '';
    const patientGender = document.getElementById('patientGender').value || '';
    const visitType = document.getElementById('visitType').value || '';
    const insurancePolicy = document.getElementById('insurancePolicy').value || '';
    
    // Show loading status
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingStatus = document.getElementById('loadingStatus');
    loadingOverlay.classList.add('active');
    loadingStatus.textContent = 'Reviewing medical documentation...';
    
    try {
        // Prepare request parameters
        const params = {
            doctorNotes,
            patientAge: parseInt(patientAge) || 35,
            patientGender: patientGender || 'male',
            visitType: visitType || 'consultation',
            insurancePolicy: insurancePolicy || ''
        };
        
        // Removed detailed log with patient data
        
        // Call the API
        const result = await window.claimkitApi.reviewMedicalDocumentation(params);
        
        // Display the review results
        const reviewResultsDisplay = document.getElementById('reviewResultsDisplay');
        
        if (result && result.status === 'success') {
            // Store the request ID for later use in enhancement
            lastReviewRequestId = result.request_id;
            // Removed detailed log with request ID
            
            const reviewFeedback = result.review || [];
            
            if (reviewFeedback && reviewFeedback.length) {
                // Format the review feedback
                const formattedFeedback = formatReviewFeedback(reviewFeedback);
                reviewResultsDisplay.innerHTML = formattedFeedback;
                
                // Show the results section
                const resultsSection = document.getElementById('resultsSection');
                if (resultsSection) {
                    resultsSection.classList.remove('hidden');
                }
                
                // Switch to ClaimKit tab and review results subtab
                switchToClaimKitTab('review-results');
                
                // Enable enhance notes button after successful review
                const enhanceNotesBtn = document.getElementById('enhanceNotesBtn');
                if (enhanceNotesBtn) {
                    enhanceNotesBtn.disabled = false;
                    enhanceNotesBtn.classList.remove('disabled');
                    
                    // Add a prompt to encourage the user to click enhance next
                    reviewResultsDisplay.innerHTML += `
                        <div class="next-action-prompt">
                            <p>Review complete! Click the "Enhance Doctor Notes" button to improve your notes based on this feedback.</p>
                        </div>
                    `;
                }
                
                showNotification('Documentation review completed. Click "Enhance Doctor Notes" to continue.', 'success');
            } else {
                reviewResultsDisplay.innerHTML = `<p>No review feedback received.</p>`;
                
                // Even with no feedback, enable enhance if we have a request ID
                if (lastReviewRequestId) {
                    const enhanceNotesBtn = document.getElementById('enhanceNotesBtn');
                    if (enhanceNotesBtn) {
                        enhanceNotesBtn.disabled = false;
                        enhanceNotesBtn.classList.remove('disabled');
                    }
                }
                
                showNotification('No review feedback received. You can still enhance your notes.', 'warning');
            }
        } else {
            reviewResultsDisplay.innerHTML = `<p>Error: ${result.message || 'Failed to review documentation.'}</p>`;
            showNotification('Failed to review documentation.', 'error');
        }
    } catch (error) {
        console.error('Error reviewing documentation');
        document.getElementById('reviewResultsDisplay').innerHTML = `<p>Error: ${error.message}</p>`;
        showNotification('Error reviewing documentation: ' + error.message, 'error');
    } finally {
        // Hide loading overlay
        loadingOverlay.classList.remove('active');
    }
}

/**
 * Handle generating insurance claim
 * Note: This will be implemented later according to the user
 */
async function handleGenerateInsuranceClaim() {
    showNotification('Insurance claim generation is not yet implemented.', 'info');
}

/**
 * Handle claim denial correction
 * Note: This will be implemented later according to the user
 */
async function handleClaimDenial() {
    showNotification('Claim denial management is not yet implemented.', 'info');
}

/**
 * Format review feedback for display
 * @param {Array} feedback - Array of feedback items
 * @returns {String} - Formatted HTML for display
 */
function formatReviewFeedback(feedback) {
    if (!feedback || !feedback.length) {
        return '<p>No review feedback available.</p>';
    }
    
    let html = '<div class="review-feedback">';
    
    feedback.forEach((item, index) => {
        html += `<div class="feedback-item">`;
        html += `<h4>${formatCategory(item.category)}</h4>`;
        
        // Try to parse the feedback as JSON if it's a string
        if (item.feedback && typeof item.feedback === 'string') {
            try {
                const feedbackData = JSON.parse(item.feedback);
                html += formatNestedFeedback(feedbackData);
            } catch (e) {
                // If parsing fails, just display as text
                html += `<div class="feedback-details"><pre>${item.feedback}</pre></div>`;
            }
        } else if (item.feedback) {
            html += `<div class="feedback-details"><pre>${JSON.stringify(item.feedback, null, 2)}</pre></div>`;
        }
        
        html += `</div>`;
    });
    
    html += '</div>';
    return html;
}

/**
 * Format a category name into a readable title
 * @param {String} category - Category identifier
 * @returns {String} - Formatted category title
 */
function formatCategory(category) {
    if (!category) return 'Feedback';
    
    // If it starts with a number, extract the number and format the rest
    const match = category.match(/^(\d+)_(.*)$/);
    if (match) {
        const [_, number, text] = match;
        return `${number}. ${formatTitle(text)}`;
    }
    
    return formatTitle(category);
}

/**
 * Format a snake_case string as Title Case
 * @param {String} text - Snake case text
 * @returns {String} - Title case text
 */
function formatTitle(text) {
    return text
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Format nested feedback JSON into readable HTML
 * @param {Object} data - Nested feedback data
 * @param {Number} level - Nesting level (for indentation)
 * @returns {String} - Formatted HTML
 */
function formatNestedFeedback(data, level = 0) {
    if (!data || typeof data !== 'object') {
        return '';
    }
    
    let html = '';
    const indent = level * 20; // 20px per level
    
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null) {
            html += `<div class="feedback-section" style="margin-left: ${indent}px">`;
            html += `<h5>${key}</h5>`;
            html += formatNestedFeedback(value, level + 1);
            html += `</div>`;
        } else {
            html += `<div class="feedback-detail" style="margin-left: ${indent}px">`;
            html += `<strong>${key}:</strong> ${value}`;
            html += `</div>`;
        }
    }
    
    return html;
}

/**
 * Switch to the ClaimKit tab and optionally a specific subtab
 * @param {String} subtab - Optional subtab to select
 */
function switchToClaimKitTab(subtab = 'enhanced-notes') {
    // First switch to main ClaimKit tab
    const mainTabs = document.querySelectorAll('.tab-button');
    const mainTabPanes = document.querySelectorAll('.tab-pane');
    
    mainTabs.forEach(tab => tab.classList.remove('active'));
    mainTabPanes.forEach(pane => pane.classList.remove('active'));
    
    const claimkitTabButton = document.querySelector('.tab-button[data-tab="claimkit"]');
    const claimkitTabPane = document.getElementById('claimkit');
    
    if (claimkitTabButton && claimkitTabPane) {
        claimkitTabButton.classList.add('active');
        claimkitTabPane.classList.add('active');
    }
    
    // Then switch to the specified subtab
    const subtabs = document.querySelectorAll('.claimkit-tab-button');
    const subtabPanes = document.querySelectorAll('.claimkit-tab-pane');
    
    subtabs.forEach(tab => tab.classList.remove('active'));
    subtabPanes.forEach(pane => pane.classList.remove('active'));
    
    const targetSubtab = document.querySelector(`.claimkit-tab-button[data-tab="${subtab}"]`);
    const targetSubtabPane = document.getElementById(subtab);
    
    if (targetSubtab && targetSubtabPane) {
        targetSubtab.classList.add('active');
        targetSubtabPane.classList.add('active');
    }
}

/**
 * Show a notification message
 * @param {String} message - Notification message
 * @param {String} type - Notification type ('success', 'error', 'warning')
 */
function showNotification(message, type = 'info') {
    const status = document.getElementById('status');
    
    if (status) {
        // Remove any existing classes
        status.className = 'status';
        
        // Create a unique animation
        status.style.animation = 'none';
        // Trigger DOM reflow
        void status.offsetWidth;
        
        // Apply new animation and styles
        status.style.animation = 'status-fade 0.3s ease forwards';
        status.classList.add(type);
        
        // Set the text content
        status.textContent = message;
        
        // Reset after 5 seconds
        setTimeout(() => {
            status.style.animation = 'status-fade-out 0.5s ease forwards';
            
            // After animation, reset to default
            setTimeout(() => {
                status.textContent = 'Ready';
                status.className = 'status';
                status.style.animation = '';
            }, 500);
        }, 5000);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
} 