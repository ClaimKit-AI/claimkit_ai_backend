/**
 * Stepper functionality for ClaimKit Voice Companion
 * Handles the multi-step interface navigation
 */

document.addEventListener('DOMContentLoaded', () => {
    initStepper();
});

/**
 * Initialize the stepper functionality
 */
function initStepper() {
    // Get all stepper elements
    const stepperSteps = document.querySelectorAll('.stepper-step');
    const stepperPanes = document.querySelectorAll('.stepper-pane');
    const stepperConnectors = document.querySelectorAll('.stepper-connector');
    
    // Navigation buttons
    const nextToStep2 = document.getElementById('nextToStep2');
    const backToStep1 = document.getElementById('backToStep1');
    const nextToStep3 = document.getElementById('nextToStep3');
    const backToStep2 = document.getElementById('backToStep2');
    const nextToStep4 = document.getElementById('nextToStep4');
    const backToStep3 = document.getElementById('backToStep3');
    const submitButton = document.getElementById('submitButton');
    const backToStep4 = document.getElementById('backToStep4');
    const restartProcess = document.getElementById('restartProcess');
    
    // API credentials elements
    const apiKeyInput = document.getElementById('apiKeyInput');
    const hospitalIdInput = document.getElementById('hospitalIdInput');
    const saveCredentialsBtn = document.getElementById('saveCredentialsBtn');
    
    // Patient information fields
    const patientAgeInput = document.getElementById('patientAge');
    const patientGenderSelect = document.getElementById('patientGender');
    const visitTypeSelect = document.getElementById('visitType');
    
    // Recording button
    const recordButton = document.getElementById('recordButton');
    
    // Initialize step trackers
    let currentStep = 1;
    const completedSteps = new Set();
    
    // Enable step 2 button when credentials are set
    if (saveCredentialsBtn) {
        saveCredentialsBtn.addEventListener('click', () => {
            // The credential saving logic is in claimkit-integration.js
            // We just need to check if credentials are set after a delay
            setTimeout(() => {
                if (window.claimkitApi && window.claimkitApi.apiKey && window.claimkitApi.hospitalId) {
                    nextToStep2.disabled = false;
                    completedSteps.add(1);
                    updateStepperUI();
                }
            }, 500);
        });
    }
    
    // Check if API credentials already exist on load
    if (window.claimkitApi && window.claimkitApi.apiKey && window.claimkitApi.hospitalId) {
        nextToStep2.disabled = false;
        completedSteps.add(1);
        updateStepperUI();
    }
    
    // Patient info fields validation
    function validatePatientInfo() {
        const isValid = patientAgeInput.value && patientGenderSelect.value && visitTypeSelect.value;
        return isValid;
    }
    
    // Add event listeners to patient info fields
    [patientAgeInput, patientGenderSelect, visitTypeSelect].forEach(field => {
        field.addEventListener('change', () => {
            nextToStep3.disabled = !validatePatientInfo();
        });
        field.addEventListener('input', () => {
            nextToStep3.disabled = !validatePatientInfo();
        });
    });
    
    // Check if patient info is already filled
    if (validatePatientInfo()) {
        nextToStep3.disabled = false;
    }
    
    // Hook into processRecording completion
    // We need to override the original function to know when to proceed to the next step
    const originalProcessRecording = window.processRecording;
    if (typeof originalProcessRecording === 'function') {
        window.processRecording = async function() {
            try {
                // Call the original function
                await originalProcessRecording.apply(this, arguments);
                
                // If we got here, the transcription was successful
                console.log("Transcription completed successfully, advancing to step 4");
                
                // Mark step 3 as completed
                completedSteps.add(3);
                updateStepperUI();
                
                // Automatically go to step 4 after a short delay
                setTimeout(() => {
                    goToStep(4);
                }, 500);
                
            } catch (error) {
                console.error("Error in processRecording:", error);
                // Don't advance on error
            }
        };
    }
    
    // Recording step
    // This will be handled by the existing recording logic, but we need to enable the next button
    // The original code sets the submit button state, we'll hook into that for our stepper
    const originalSetSubmitButtonState = window.setSubmitButtonState;
    if (typeof originalSetSubmitButtonState === 'function') {
        window.setSubmitButtonState = function(enabled) {
            // Call the original function first
            originalSetSubmitButtonState(enabled);
            
            // Also update our stepper navigation
            if (nextToStep4) {
                nextToStep4.disabled = !enabled;
                if (enabled) {
                    completedSteps.add(3);
                    updateStepperUI();
                }
            }
        };
    }
    
    // Navigation button event listeners
    if (nextToStep2) {
        nextToStep2.addEventListener('click', () => {
            goToStep(2);
        });
    }
    
    if (backToStep1) {
        backToStep1.addEventListener('click', () => {
            goToStep(1);
        });
    }
    
    if (nextToStep3) {
        nextToStep3.addEventListener('click', () => {
            // Add step 2 to completed steps
            completedSteps.add(2);
            updateStepperUI();
            goToStep(3);
        });
    }
    
    if (backToStep2) {
        backToStep2.addEventListener('click', () => {
            goToStep(2);
        });
    }
    
    if (nextToStep4) {
        nextToStep4.addEventListener('click', () => {
            goToStep(4);
        });
    }
    
    if (backToStep3) {
        backToStep3.addEventListener('click', () => {
            goToStep(3);
        });
    }
    
    // Override submit button to go to step 5
    if (submitButton) {
        const originalSubmitClick = submitButton.onclick;
        submitButton.onclick = function(event) {
            // First check if original click should proceed
            if (typeof originalSubmitClick === 'function') {
                const result = originalSubmitClick.call(this, event);
                if (result === false) {
                    return false;
                }
            }
            
            // Add step 4 to completed steps
            completedSteps.add(4);
            updateStepperUI();
            
            // Wait for a short delay to allow processing to start
            setTimeout(() => {
                goToStep(5);
            }, 300);
            
            return true;
        };
    }
    
    if (backToStep4) {
        backToStep4.addEventListener('click', () => {
            goToStep(4);
        });
    }
    
    if (restartProcess) {
        restartProcess.addEventListener('click', () => {
            // Clear completed steps
            completedSteps.clear();
            completedSteps.add(1); // Keep step 1 completed if credentials are set
            
            // Reset UI
            updateStepperUI();
            
            // Go back to step 1
            goToStep(1);
            
            // Call the reset functionality if it exists
            if (typeof window.resetRecording === 'function') {
                window.resetRecording();
            }
            
            // Reset the transcription display
            const transcriptionDisplay = document.getElementById('transcriptionDisplay');
            if (transcriptionDisplay) {
                transcriptionDisplay.innerHTML = '<p class="placeholder">Your transcribed notes will appear here...</p>';
            }
            
            // Reset result sections
            const formattedNote = document.getElementById('formattedNote');
            if (formattedNote) {
                formattedNote.innerHTML = '';
            }
            
            const structuredData = document.getElementById('structuredData');
            if (structuredData) {
                structuredData.innerHTML = '';
            }
        });
    }
    
    /**
     * Go to a specific step
     * @param {Number} step - Step number to navigate to
     */
    function goToStep(step) {
        if (step < 1 || step > stepperSteps.length) {
            console.error('Invalid step number');
            return;
        }
        
        // Update current step
        currentStep = step;
        
        // Update stepper steps UI
        stepperSteps.forEach((stepEl, index) => {
            const stepNumber = index + 1;
            stepEl.classList.remove('active');
            
            if (stepNumber === currentStep) {
                stepEl.classList.add('active');
            }
        });
        
        // Update stepper connectors
        stepperConnectors.forEach((connector, index) => {
            connector.classList.remove('active');
            
            // Connector index is 0-based, but steps are 1-based
            if (index < currentStep - 1) {
                connector.classList.add('active');
            }
        });
        
        // Update content panes
        stepperPanes.forEach((pane, index) => {
            pane.classList.remove('active');
            
            if (index === currentStep - 1) {
                pane.classList.add('active');
            }
        });
        
        // Scroll to top of the new step
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    /**
     * Update the stepper UI based on completed steps
     */
    function updateStepperUI() {
        stepperSteps.forEach((stepEl, index) => {
            const stepNumber = index + 1;
            stepEl.classList.remove('completed');
            
            if (completedSteps.has(stepNumber)) {
                stepEl.classList.add('completed');
            }
        });
        
        // Update connectors based on completed steps
        stepperConnectors.forEach((connector, index) => {
            connector.classList.remove('active');
            
            // Connector is active if both adjacent steps are completed
            if (completedSteps.has(index + 1) && completedSteps.has(index + 2)) {
                connector.classList.add('active');
            }
        });
    }
    
    // Make goToStep function available globally
    window.goToStep = goToStep;
} 