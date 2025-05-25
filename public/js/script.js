// DOM Elements
const recordButton = document.getElementById('recordButton');
const resetButton = document.getElementById('resetButton');
const submitButton = document.getElementById('submitButton');
const voiceAnimation = document.getElementById('voiceAnimation');
const statusElement = document.getElementById('status');
const transcriptionStatus = document.getElementById('transcriptionStatus');
const transcriptionDisplay = document.getElementById('transcriptionDisplay');
const editTranscriptionBtn = document.getElementById('editTranscriptionBtn');
const transcriptionEdit = document.getElementById('transcriptionEdit');
const transcriptionText = document.getElementById('transcriptionText');
const cancelEdit = document.getElementById('cancelEdit');
const saveEdit = document.getElementById('saveEdit');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingStatus = document.getElementById('loadingStatus');
const resultsSection = document.getElementById('resultsSection');
const patientAge = document.getElementById('patientAge');
const patientGender = document.getElementById('patientGender');
const visitType = document.getElementById('visitType');
const insurancePolicy = document.getElementById('insurancePolicy');
const reviewFeedback = document.getElementById('reviewFeedback');
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanes = document.querySelectorAll('.tab-pane');
const formattedNote = document.getElementById('formattedNote');
const structuredData = document.getElementById('structuredData');
const inconsistenciesList = document.getElementById('inconsistenciesList');
const gapsResolvedList = document.getElementById('gapsResolvedList');
const enhancementsImplementedList = document.getElementById('enhancementsImplementedList');
// New EMR UI elements
const generateDocumentationBtn = document.getElementById('generateDocumentationBtn');
const saveDocumentationBtn = document.getElementById('saveDocumentationBtn');
const exportDocumentationBtn = document.getElementById('exportDocumentationBtn');
const emrPatientAge = document.getElementById('emrPatientAge');
const emrPatientGender = document.getElementById('emrPatientGender');
const emrVisitType = document.getElementById('emrVisitType');
const emrChiefComplaint = document.getElementById('emrChiefComplaint');
const emrSecondaryComplaints = document.getElementById('emrSecondaryComplaints');
const emrHPI = document.getElementById('emrHPI');
const emrConditions = document.getElementById('emrConditions');
const emrSurgeries = document.getElementById('emrSurgeries');
const emrAllergies = document.getElementById('emrAllergies');
// Vital signs inputs
const emrBP = document.getElementById('emrBP');
const emrHR = document.getElementById('emrHR');
const emrRR = document.getElementById('emrRR');
const emrTemp = document.getElementById('emrTemp');
const emrO2 = document.getElementById('emrO2');
const emrHeight = document.getElementById('emrHeight');
const emrWeight = document.getElementById('emrWeight');
const emrBMI = document.getElementById('emrBMI');
// Container elements
const emrAssessmentsContainer = document.getElementById('emrAssessmentsContainer');
const emrPrescribedMedsContainer = document.getElementById('emrPrescribedMedsContainer');
const emrSuggestedMeds = document.getElementById('emrSuggestedMeds');
const emrPrescribedTreatmentsContainer = document.getElementById('emrPrescribedTreatmentsContainer');
const emrSuggestedTreatments = document.getElementById('emrSuggestedTreatments');
const emrPerformedProceduresContainer = document.getElementById('emrPerformedProceduresContainer');
const emrSuggestedProcedures = document.getElementById('emrSuggestedProcedures');
const emrFollowUpTiming = document.getElementById('emrFollowUpTiming');
const emrFollowUpInstructions = document.getElementById('emrFollowUpInstructions');
const emrReferralsContainer = document.getElementById('emrReferralsContainer');
// Add item buttons
const addAssessmentBtn = document.getElementById('addAssessmentBtn');
const addMedicationBtn = document.getElementById('addMedicationBtn');
const addTreatmentBtn = document.getElementById('addTreatmentBtn');
const addProcedureBtn = document.getElementById('addProcedureBtn');
const addReferralBtn = document.getElementById('addReferralBtn');

// State Variables
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let transcription = '';
let enhancementResult = null;
let clinicalDocumentation = null; // New state variable for clinical documentation
let selectedItems = {  // Track selected suggestions
    medications: [],
    treatments: [],
    procedures: []
};
let audioContext;
let audioAnalyser;
let audioSource;
let recordingTimer;
let isAudioDetected = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded, initializing app...");
    initializeUI();
    setupEventListeners();
    
    // Make functions available globally
    window.processRecording = processRecording;
    window.resetRecording = resetAll;
    window.setSubmitButtonState = function(enabled) {
        if (submitButton) {
            submitButton.disabled = !enabled;
        }
        if (resetButton) {
            resetButton.disabled = !enabled;
        }
    };
    
    // These setup functions need to run after the DOM is fully loaded
    setTimeout(() => {
        console.log("Running deferred setup functions...");
        setupTemplateCards();
        setupClaimsDashboardModal();
        console.log("Deferred setup complete");
    }, 500);
});

// UI Initialization
function initializeUI() {
    setStatus('Ready to record');
    resultsSection.classList.add('hidden');
}

// Event Listeners
function setupEventListeners() {
    // Record button
    recordButton.addEventListener('click', toggleRecording);
    
    // Reset button
    resetButton.addEventListener('click', resetAll);
    
    // Submit button - Update to use ClaimKit workflow
    submitButton.addEventListener('click', function() {
        // Start the ClaimKit review process
        if (window.claimkitApi) {
            // Call the ClaimKit review handler from claimkit-integration.js
            triggerClaimKitReview();
        } else {
            // Fallback to the old method if ClaimKit integration isn't available
            enhanceDoctorNotes();
        }
    });
    
    // Edit transcription
    editTranscriptionBtn.addEventListener('click', showEditTranscription);
    
    // Cancel edit
    cancelEdit.addEventListener('click', hideEditTranscription);
    
    // Save edit
    saveEdit.addEventListener('click', saveTranscriptionEdit);
    
    // Tab navigation
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.getAttribute('data-tab');
            activateTab(tab);
        });
    });
    
    // Generate clinical documentation button
    if (generateDocumentationBtn) {
        generateDocumentationBtn.addEventListener('click', generateClinicalDocumentation);
    }
    
    // Save documentation button
    const saveDocBtn = document.getElementById('saveDocumentationBtn');
    if (saveDocBtn) {
        saveDocBtn.addEventListener('click', saveDocumentation);
        console.log("Save documentation button event listener attached");
    } else {
        console.warn("Save documentation button not found");
    }
    
    // Export documentation button
    if (exportDocumentationBtn) {
        exportDocumentationBtn.addEventListener('click', exportClinicalDocumentation);
    }
    
    // Add item buttons
    setupEmrButtons();
}

// Voice Recording Functions
async function toggleRecording() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

async function startRecording() {
    try {
        console.log("Starting recording - requesting microphone access");
        setStatus('Requesting microphone access...');
        
        // Request audio with higher quality for better transcription
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false, // Turn off echo cancellation for clearer speech
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 48000, // High sample rate
                channelCount: 1, // Mono audio works better with Whisper
                // Set high bitrate for better quality
                sampleSize: 16
            } 
        });
        
        console.log("Microphone access granted", stream);
        setStatus('Microphone connected. Starting recording...');
        
        // Set up audio context for visualization and monitoring
        audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 48000  // High sample rate for better quality
        });
        audioAnalyser = audioContext.createAnalyser();
        audioSource = audioContext.createMediaStreamSource(stream);
        audioSource.connect(audioAnalyser);
        
        // Set up audio monitoring
        setupAudioMonitoring();
        
        // Configure MediaRecorder with codec that Whisper supports well
        // WebM with Opus codec is well-supported
        const options = { 
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 128000 // Higher bitrate for better quality
        };
        
        try {
            mediaRecorder = new MediaRecorder(stream, options);
            console.log("MediaRecorder created with options:", options);
        } catch (e) {
            // Fallback for unsupported codec
            console.warn('Opus codec not supported, falling back to default codec');
            mediaRecorder = new MediaRecorder(stream);
            console.log("MediaRecorder created with default options");
        }
        
        console.log("MediaRecorder state:", mediaRecorder.state);
        
        audioChunks = [];
        
        mediaRecorder.addEventListener('dataavailable', event => {
            if (event.data.size > 0) {
                console.log(`Audio chunk received: ${event.data.size} bytes`);
                audioChunks.push(event.data);
            } else {
                console.warn("Received empty audio chunk");
            }
        });
        
        mediaRecorder.addEventListener('start', () => {
            console.log("MediaRecorder started");
        });
        
        mediaRecorder.addEventListener('stop', async () => {
            console.log("MediaRecorder stopped");
            
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
            
            // Clean up audio context
            if (audioContext) {
                audioSource.disconnect();
                clearInterval(recordingTimer);
            }
            
            processRecording();
        });
        
        // Start recording with smaller timeslice for smoother audio chunks
        mediaRecorder.start(250);
        isRecording = true;
        
        // Show recording time to user
        let recordingTime = 0;
        recordingTimer = setInterval(() => {
            recordingTime += 1;
            // Ensure recording is at least 2 seconds
            if (recordingTime < 2) {
                submitButton.disabled = true;
            } else {
                submitButton.disabled = false;
            }
            setStatus(`Recording audio... ${recordingTime}s (${isAudioDetected ? 'Audio detected' : 'No audio detected'})`);
        }, 1000);
        
        // Update UI
        recordButton.classList.add('recording');
        recordButton.querySelector('span').textContent = 'Recording...';
        recordButton.querySelector('i').className = 'fas fa-stop';
        voiceAnimation.classList.add('active');
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        setStatus(`Error: Could not access microphone - ${error.message}`);
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        console.log("Stopping recording");
        mediaRecorder.stop();
        isRecording = false;
        
        // Update UI
        recordButton.classList.remove('recording');
        recordButton.querySelector('span').textContent = 'Press to Talk';
        recordButton.querySelector('i').className = 'fas fa-microphone';
        voiceAnimation.classList.remove('active');
        setStatus('Processing audio...');
        
        clearInterval(recordingTimer);
    }
}

async function processRecording() {
    setTranscriptionStatus('Processing audio...');
    
    try {
        showLoading('Processing audio...');
        
        // Create audio blob
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log(`Audio blob created: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
        
        // Debug: add audio playback to verify recording worked
        const audioURL = URL.createObjectURL(audioBlob);
        addAudioPlayer(audioURL);
        
        if (audioBlob.size < 1000) {
            throw new Error("Audio recording too short or empty. Please try again and speak louder.");
        }
        
        // Get optimized audio for Whisper API
        const optimizedAudio = await optimizeAudioForWhisper(audioBlob);
        console.log("Audio optimized for transcription");
        
        showLoading('Transcribing audio with Whisper...');
        
        // Call the backend API to transcribe using Whisper
        const response = await callWhisperAPI(optimizedAudio);
        console.log("Transcription API response:", response);
        
        if (!response || !response.text) {
            throw new Error("Transcription service returned empty result");
        }
        
        // Process the transcription to extract medical information
        transcription = response.text;
        
        // Display transcription
        displayTranscription(transcription);
        
        // Enable editing and submission
        editTranscriptionBtn.disabled = false;
        submitButton.disabled = false;
        resetButton.disabled = false;
        
        hideLoading();
        setStatus('Transcription complete');
        setTranscriptionStatus('Transcription complete');
        
    } catch (error) {
        console.error('Error transcribing audio:', error);
        setStatus(`Error: ${error.message}`);
        setTranscriptionStatus(`Failed: ${error.message}`);
        hideLoading();
    }
}

/**
 * Optimize audio for Whisper API
 * Ensures the audio format and quality are ideal for transcription
 */
async function optimizeAudioForWhisper(audioBlob) {
    try {
        console.log(`Optimizing audio - original size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
        
        // Check if the blob is valid
        if (audioBlob.size === 0) {
            throw new Error('Empty audio recording');
        }
        
        // Check if the audio duration is too short
        if (audioBlob.size < 5000) { // Approximately < 0.5 seconds
            throw new Error('Recording too short (minimum 1-2 seconds required)');
        }
        
        // For best results with Whisper API, we should use WAV/MP3 format
        // But for this implementation we'll just use the original WebM
        // In a production app, you would convert to a better format
        
        // Log useful info about the audio
        console.log(`Audio ready for transcription: ${audioBlob.size} bytes`);
        
        return audioBlob;
    } catch (error) {
        console.error('Error optimizing audio:', error);
        throw error;
    }
}

// Transcription Display Functions
function displayTranscription(text) {
    transcriptionDisplay.innerHTML = `<p>${text}</p>`;
    transcriptionText.value = text;
}

function showEditTranscription() {
    transcriptionDisplay.classList.add('hidden');
    transcriptionEdit.classList.remove('hidden');
}

function hideEditTranscription() {
    transcriptionEdit.classList.add('hidden');
    transcriptionDisplay.classList.remove('hidden');
}

function saveTranscriptionEdit() {
    transcription = transcriptionText.value;
    displayTranscription(transcription);
    hideEditTranscription();
}

// Doctor Notes Enhancement Functions
async function enhanceDoctorNotes() {
    // Validate required fields
    if (!validatePatientInfo()) {
        setStatus('Please fill in all required patient information');
        return;
    }
    
    if (!transcription) {
        setStatus('No transcription available');
        return;
    }
    
    showLoading('Enhancing doctor notes...');
    
    // Prepare the request data
    const requestData = {
        notes: transcription,
        patientAge: parseInt(patientAge.value),
        patientGender: patientGender.value,
        visitType: visitType.value,
        insurancePolicy: insurancePolicy.value,
        reviewFeedback: reviewFeedback.value
    };
    
    try {
        console.log('Enhancing doctor notes with data:', requestData);
        
        // Call the backend API to enhance doctor notes
        const result = await callDoctorNotesAPI(requestData);
        
        // Store and display results
        enhancementResult = result.data;
        displayResults(enhancementResult);
        
        hideLoading();
        setStatus('Enhancement complete');
        resultsSection.classList.remove('hidden');
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // Show the claims dashboard modal
        window.showClaimsDashboardModal();
        
    } catch (error) {
        console.error('Error enhancing doctor notes:', error);
        setStatus(`Error: Enhancement failed - ${error.message}`);
        hideLoading();
    }
}

function validatePatientInfo() {
    if (!patientAge.value || !patientGender.value || !visitType.value) {
        return false;
    }
    return true;
}

// API Call Functions
async function callWhisperAPI(audioBlob) {
    try {
        console.log(`Sending audio file to API (size: ${audioBlob.size} bytes, type: ${audioBlob.type})`);
        
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');
        
        console.log('FormData created, sending to server...');
        
        const response = await fetch('/api/v1/ai/transcribe', {
            method: 'POST',
            body: formData
        });
        
        console.log(`Server response status: ${response.status} ${response.statusText}`);
        
        const responseData = await response.json();
        console.log('Response data:', responseData);
        
        if (!response.ok) {
            throw new Error(responseData.message || `Transcription failed: ${response.statusText}`);
        }
        
        if (!responseData.data || !responseData.data.text) {
            console.error('Missing text in response:', responseData);
            throw new Error('Server returned empty transcription');
        }
        
        console.log(`Transcription successful (${responseData.data.text.length} characters)`);
        return responseData.data;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

async function callDoctorNotesAPI(requestData) {
    try {
        console.log('Calling doctor notes API with data:', requestData);
        
        const response = await fetch('/api/v1/ai/doctor-notes/enhance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('Doctor notes API response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Enhancement failed: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log('Doctor notes API response data:', responseData);
        return responseData;
    } catch (error) {
        console.error('Doctor notes API error:', error);
        throw error;
    }
}

// UI Display Functions
function displayResults(results) {
    // Format the structured note tab
    formattedNote.textContent = results.formattedNote;
    
    // Format the structured data tab
    structuredData.innerHTML = `<pre>${JSON.stringify(results.enhancedNote, null, 2)}</pre>`;
    
    // Populate enhancements tab
    displayList(inconsistenciesList, results.inconsistenciesFound);
    displayList(gapsResolvedList, results.gapsResolved);
    displayList(enhancementsImplementedList, results.enhancementsImplemented);
}

function displayList(element, items) {
    element.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        element.appendChild(li);
    });
}

function activateTab(tabId) {
    // Update tab buttons
    tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === tabId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Update tab panes
    tabPanes.forEach(pane => {
        if (pane.id === tabId) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });
}

// Utility Functions
function resetAll() {
    // Reset transcription
    transcription = '';
    displayTranscription('<p class="placeholder">Your transcribed notes will appear here...</p>');
    
    // Reset patient info
    patientAge.value = '';
    patientGender.value = '';
    visitType.value = '';
    insurancePolicy.value = '';
    reviewFeedback.value = '';
    
    // Reset UI
    editTranscriptionBtn.disabled = true;
    submitButton.disabled = true;
    resetButton.disabled = true;
    resultsSection.classList.add('hidden');
    
    setStatus('Ready to record');
    setTranscriptionStatus('Waiting for recording');
}

function setStatus(message) {
    statusElement.textContent = message;
}

function setTranscriptionStatus(message) {
    transcriptionStatus.textContent = message;
}

function showLoading(message) {
    loadingStatus.textContent = message || 'Processing...';
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

// Function to monitor audio levels
function setupAudioMonitoring() {
    audioAnalyser.fftSize = 256;
    const bufferLength = audioAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Check audio levels every 100ms
    const audioCheckInterval = setInterval(() => {
        if (!isRecording) {
            clearInterval(audioCheckInterval);
            return;
        }
        
        audioAnalyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        // Update audio detection flag
        isAudioDetected = average > 10; // Threshold for considering audio detected
        
        // Animate based on audio level
        const waves = document.querySelectorAll('.wave');
        if (isAudioDetected) {
            // More energetic animation when audio is detected
            waves.forEach((wave, index) => {
                wave.style.animationDuration = `${1.5 - (average/500)}s`;
                wave.style.opacity = Math.min(1, average / 50);
            });
        }
    }, 100);
}

// Add this function to create an audio player for debugging
function addAudioPlayer(audioURL) {
    const playerContainer = document.createElement('div');
    playerContainer.className = 'audio-player';
    playerContainer.innerHTML = `
        <p>Recording preview (for debugging):</p>
        <audio controls src="${audioURL}"></audio>
    `;
    
    // Insert before the transcription display
    const transcriptionArea = document.querySelector('.transcription-area');
    transcriptionArea.parentNode.insertBefore(playerContainer, transcriptionArea);
}

// Clinical Documentation Functions

/**
 * Generate clinical documentation from transcription
 */
async function generateClinicalDocumentation() {
    // First check if we have transcription or enhanced results
    if (!transcription && !enhancementResult) {
        setStatus('No transcription or enhanced notes available');
        return;
    }
    
    try {
        showLoading('Generating clinical documentation...');
        
        // Determine what source to use (prefer formatted note over raw transcription)
        const useFormattedNote = enhancementResult && enhancementResult.formattedNote;
        const sourceText = useFormattedNote ? enhancementResult.formattedNote : transcription;
        
        console.log(`Generating clinical documentation using ${useFormattedNote ? 'formatted note' : 'raw transcription'}`);
        console.log("Source text:", sourceText.substring(0, 100) + '...');
        
        // Use mock data for testing (set to true to use mock data, false to use real API)
        const useMockData = false;
        
        let result;
        
        if (useMockData) {
            console.log("Using mock data for clinical documentation");
            // Generate mock data for testing purposes
            result = {
                status: 'success',
                data: getMockClinicalDocumentation()
            };
            console.log("Mock data generated:", result);
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
            console.log("Using real API for clinical documentation");
            // Prepare the request data
            const requestData = {
                transcription: sourceText,
                patientInfo: {
                    age: patientAge.value,
                    gender: patientGender.value,
                    visitType: visitType.value
                },
                insurancePolicy: insurancePolicy.value || undefined
            };
            
            // Call the API
            result = await callClinicalDocumentationAPI(requestData);
            
            // Transform API response to expected format
            result.data = transformApiResponse(result.data);
        }
        
        // Store the result
        clinicalDocumentation = result.data;
        
        // Populate the EMR interface
        console.log("Calling populateEMRInterface with data:", clinicalDocumentation);
        populateEMRInterface(clinicalDocumentation);
        
        // Switch to the EMR tab
        activateTab('emr');
        
        hideLoading();
        setStatus('Clinical documentation generated successfully');
        
    } catch (error) {
        console.error('Error generating clinical documentation:', error);
        setStatus(`Error: ${error.message}`);
        hideLoading();
    }
}

/**
 * Transform API response to match the expected format for EMR interface
 */
function transformApiResponse(apiData) {
    console.log("Transforming API response:", apiData);
    
    // Create secondary complaints from symptoms if available
    let secondaryComplaints = [];
    if (apiData.HistoryOfPresentIllness && apiData.HistoryOfPresentIllness.Symptoms) {
        // Split by commas if multiple symptoms
        secondaryComplaints = apiData.HistoryOfPresentIllness.Symptoms.split(',')
            .map(symptom => symptom.trim())
            .filter(symptom => symptom.toLowerCase() !== apiData.ChiefComplaint.toLowerCase()); // Remove chief complaint
    }
    
    // Create assessments from diagnoses
    const assessments = (apiData.Diagnoses || []).map(diagnosis => ({
        diagnosis: diagnosis.Diagnosis,
        icdCode: diagnosis.ICD10Code,
        clinicalEvidence: diagnosis.Evidence || 'Based on patient symptoms and history',
        certainty: diagnosis.Certainty || 'High'
    }));
    
    // Create medications from prescribed and suggested treatments
    const medications = {
        prescribed: [],
        suggested: []
    };
    
    // Create procedures from prescribed tests/procedures
    const procedures = {
        performed: [],
        suggested: []
    };
    
    // Create treatment plan
    const treatmentPlan = {
        prescribed: [],
        suggested: []
    };
    
    // Process medications and treatments
    if (apiData.MedicationsAndTreatments) {
        // Process prescribed items
        if (apiData.MedicationsAndTreatments.Prescribed) {
            apiData.MedicationsAndTreatments.Prescribed.forEach(item => {
                if (item.Medication) {
                    medications.prescribed.push({
                        name: item.Medication,
                        dosage: item.Dosage || 'As directed',
                        frequency: item.Frequency || 'As needed',
                        duration: item.Duration || 'Until symptoms resolve',
                        instructions: item.Details || item.Instructions || ''
                    });
                } else if (item.Procedure || item.Test) {
                    procedures.performed.push({
                        name: item.Procedure || item.Test,
                        cptCode: item.CPTCode || '',
                        notes: item.Details || item.Rationale || ''
                    });
                } else if (item.Treatment) {
                    treatmentPlan.prescribed.push({
                        treatment: item.Treatment,
                        instructions: item.Details || item.Instructions || '',
                        duration: item.Duration || 'As needed'
                    });
                }
            });
        }
        
        // Process suggested items
        if (apiData.MedicationsAndTreatments.Suggested) {
            apiData.MedicationsAndTreatments.Suggested.forEach(item => {
                if (item.Medication) {
                    medications.suggested.push({
                        name: item.Medication,
                        dosage: item.Dosage || 'As directed',
                        frequency: item.Frequency || 'As needed',
                        duration: item.Duration || 'Until symptoms resolve',
                        instructions: item.Details || item.Instructions || '',
                        rationale: item.Rationale || 'Recommended for symptom management'
                    });
                } else if (item.Procedure || item.Test) {
                    procedures.suggested.push({
                        name: item.Procedure || item.Test,
                        cptCode: item.CPTCode || '',
                        medicalNecessity: item.Details || item.Rationale || '',
                        rationale: item.Rationale || 'Recommended for diagnosis/treatment'
                    });
                } else if (item.Treatment) {
                    treatmentPlan.suggested.push({
                        treatment: item.Treatment,
                        instructions: item.Details || item.Instructions || '',
                        duration: item.Duration || 'As needed',
                        rationale: item.Rationale || 'Recommended for condition management'
                    });
                }
            });
        }
    }
    
    // Extract HPI text from object
    let hpiText = '';
    if (apiData.HistoryOfPresentIllness) {
        const hpi = apiData.HistoryOfPresentIllness;
        let hpiParts = [];
        
        if (hpi.Onset) hpiParts.push(`Onset: ${hpi.Onset}`);
        if (hpi.Symptoms) hpiParts.push(`Symptoms: ${hpi.Symptoms}`);
        if (hpi.Context) hpiParts.push(`Context: ${hpi.Context}`);
        
        hpiText = hpiParts.join('. ');
    }
    
    // Create past medical history
    const pastMedicalHistory = {
        conditions: [],
        surgeries: [],
        allergies: []
    };
    
    // Extract any conditions if available
    if (apiData.PastMedicalHistory && apiData.PastMedicalHistory.Conditions) {
        pastMedicalHistory.conditions = Array.isArray(apiData.PastMedicalHistory.Conditions) 
            ? apiData.PastMedicalHistory.Conditions 
            : [apiData.PastMedicalHistory.Conditions];
    }
    
    // Extract any allergies if available
    if (apiData.Allergies && apiData.Allergies.List) {
        pastMedicalHistory.allergies = Array.isArray(apiData.Allergies.List) 
            ? apiData.Allergies.List 
            : [apiData.Allergies.List];
    }
    
    // Build the transformed data structure
    const transformedData = {
        clinicalDocumentation: {
            chiefComplaint: apiData.ChiefComplaint || '',
            secondaryComplaints: secondaryComplaints,
            historyOfPresentIllness: hpiText,
            pastMedicalHistory: pastMedicalHistory,
            vitalSigns: {
                bloodPressure: apiData.VitalSigns?.BloodPressure || '',
                heartRate: apiData.VitalSigns?.HeartRate || '',
                respiratoryRate: apiData.VitalSigns?.RespiratoryRate || '',
                temperature: apiData.VitalSigns?.Temperature || '',
                oxygenSaturation: apiData.VitalSigns?.OxygenSaturation || '',
                height: apiData.VitalSigns?.Height || '',
                weight: apiData.VitalSigns?.Weight || '',
                bmi: apiData.VitalSigns?.BMI || ''
            },
            assessments: assessments,
            medications: medications,
            treatmentPlan: treatmentPlan,
            procedures: procedures,
            followUp: {
                timing: apiData.FollowUp?.Timing || '2 weeks',
                instructions: apiData.FollowUp?.Instructions || 'Return if symptoms worsen',
                referrals: apiData.FollowUp?.Referrals?.map(r => ({
                    speciality: r.Speciality,
                    reason: r.Reason
                })) || []
            }
        }
    };
    
    console.log("Transformed data:", transformedData);
    return transformedData;
}

/**
 * Generate a mock clinical documentation for testing
 */
function getMockClinicalDocumentation() {
    return {
        clinicalDocumentation: {
            chiefComplaint: "Persistent headache for 3 days",
            secondaryComplaints: [
                "Mild nausea",
                "Light sensitivity"
            ],
            historyOfPresentIllness: "Patient reports throbbing headache that began 3 days ago after a stressful work event. Pain is primarily frontal and temporal, rated 7/10. Aggravated by bright lights and noise. Some relief with over-the-counter NSAIDs.",
            pastMedicalHistory: {
                conditions: [
                    "Migraine (diagnosed 2018)",
                    "Seasonal allergies",
                    "Mild hypertension"
                ],
                surgeries: [
                    "Appendectomy (2010)"
                ],
                allergies: [
                    "Penicillin - rash",
                    "Latex - contact dermatitis"
                ]
            },
            vitalSigns: {
                bloodPressure: "135/85 mmHg",
                heartRate: "78 bpm",
                respiratoryRate: "16/min",
                temperature: "37.0°C",
                oxygenSaturation: "99%",
                height: "175 cm",
                weight: "70 kg",
                bmi: "22.9"
            },
            assessments: [
                {
                    diagnosis: "Tension Headache",
                    icdCode: "G44.209",
                    clinicalEvidence: "Bilateral, non-pulsatile headache with no aura or neurological symptoms. Associated with recent stress.",
                    certainty: "High"
                },
                {
                    diagnosis: "Mild Dehydration",
                    icdCode: "E86.0",
                    clinicalEvidence: "Patient reports decreased fluid intake during busy work period.",
                    certainty: "Medium"
                }
            ],
            medications: {
                prescribed: [
                    {
                        name: "Sumatriptan",
                        dosage: "50mg",
                        frequency: "As needed for migraine",
                        duration: "PRN",
                        instructions: "Take at onset of migraine symptoms. May repeat after 2 hours if needed. Do not exceed 200mg in 24 hours."
                    },
                    {
                        name: "Metoprolol",
                        dosage: "25mg",
                        frequency: "Once daily",
                        duration: "30 days",
                        instructions: "Take with food in the morning."
                    }
                ],
                suggested: [
                    {
                        name: "Topiramate",
                        dosage: "25mg",
                        frequency: "Once daily",
                        duration: "Start if headaches persist after 2 weeks",
                        instructions: "Take at bedtime. Titrate up to 50mg after 1 week if tolerated.",
                        rationale: "For migraine prophylaxis if current treatments inadequate."
                    },
                    {
                        name: "Amitriptyline",
                        dosage: "10mg",
                        frequency: "Once daily at bedtime",
                        duration: "Consider for chronic tension headaches",
                        instructions: "Take 1-2 hours before bedtime.",
                        rationale: "Alternative for prophylaxis with additional benefit for sleep disturbance."
                    }
                ]
            },
            treatmentPlan: {
                prescribed: [
                    {
                        treatment: "Increased hydration",
                        instructions: "Drink minimum 2.5L water daily",
                        duration: "Ongoing"
                    },
                    {
                        treatment: "Stress management",
                        instructions: "Practice mindfulness exercises for 10 minutes twice daily",
                        duration: "Daily for at least 3 weeks"
                    }
                ],
                suggested: [
                    {
                        treatment: "Biofeedback therapy",
                        instructions: "Consider referral if stress management techniques ineffective",
                        duration: "6-8 weekly sessions",
                        rationale: "Evidence-based non-pharmacological approach for tension headaches"
                    },
                    {
                        treatment: "Trigger point therapy",
                        instructions: "Focus on cervical and temporal regions",
                        duration: "Twice weekly for 3 weeks",
                        rationale: "May help reduce muscle tension contributing to headaches"
                    }
                ]
            },
            procedures: {
                performed: [
                    {
                        name: "Basic neurological examination",
                        cptCode: "99204",
                        notes: "No abnormal findings. Cranial nerves II-XII intact."
                    }
                ],
                suggested: [
                    {
                        name: "MRI Brain without contrast",
                        cptCode: "70551",
                        medicalNecessity: "If headaches persist > 4 weeks or change in character",
                        rationale: "To rule out structural causes if symptoms persist or change"
                    },
                    {
                        name: "Trigger point injections",
                        cptCode: "20552",
                        medicalNecessity: "Consider if muscle tension persists despite other treatments",
                        rationale: "May provide relief for refractory muscle tension contributing to headaches"
                    }
                ]
            },
            followUp: {
                timing: "2 weeks",
                instructions: "Return sooner if symptoms worsen or new symptoms develop",
                referrals: [
                    {
                        speciality: "Neurology",
                        reason: "If headaches persist despite treatment or change in character"
                    }
                ]
            }
        }
    };
}

/**
 * Call the clinical documentation API
 */
async function callClinicalDocumentationAPI(requestData) {
    const response = await fetch('/api/v1/ai/test/clinical-documentation/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Documentation generation failed: ${response.statusText}`);
    }
    
    return await response.json();
}

/**
 * Populate the EMR interface with clinical documentation
 */
function populateEMRInterface(documentation) {
    const doc = documentation.clinicalDocumentation;
    
    // Reset selected items
    selectedItems = {
        medications: [],
        treatments: [],
        procedures: []
    };
    
    // Populate patient info
    emrPatientAge.textContent = patientAge.value + ' years';
    emrPatientGender.textContent = patientGender.value;
    emrVisitType.textContent = visitType.value;
    
    // Chief complaint
    emrChiefComplaint.value = doc.chiefComplaint || '';
    
    // Secondary complaints
    if (doc.secondaryComplaints && doc.secondaryComplaints.length > 0) {
        emrSecondaryComplaints.value = doc.secondaryComplaints.join('\n');
    } else {
        emrSecondaryComplaints.value = '';
    }
    
    // History of present illness
    emrHPI.value = doc.historyOfPresentIllness || '';
    
    // Past medical history
    if (doc.pastMedicalHistory) {
        emrConditions.value = doc.pastMedicalHistory.conditions ? doc.pastMedicalHistory.conditions.join('\n') : '';
        emrSurgeries.value = doc.pastMedicalHistory.surgeries ? doc.pastMedicalHistory.surgeries.join('\n') : '';
        emrAllergies.value = doc.pastMedicalHistory.allergies ? doc.pastMedicalHistory.allergies.join('\n') : '';
    }
    
    // Vital signs
    if (doc.vitalSigns) {
        emrBP.value = doc.vitalSigns.bloodPressure || '';
        emrHR.value = doc.vitalSigns.heartRate || '';
        emrRR.value = doc.vitalSigns.respiratoryRate || '';
        emrTemp.value = doc.vitalSigns.temperature || '';
        emrO2.value = doc.vitalSigns.oxygenSaturation || '';
        emrHeight.value = doc.vitalSigns.height || '';
        emrWeight.value = doc.vitalSigns.weight || '';
        emrBMI.value = doc.vitalSigns.bmi || '';
    }
    
    // Assessments
    populateAssessmentForms(emrAssessmentsContainer, doc.assessments || []);
    
    // Medications
    populateMedicationForms(emrPrescribedMedsContainer, doc.medications?.prescribed || []);
    populateSelectableList(emrSuggestedMeds, doc.medications?.suggested || [], 'medication');
    
    // Treatments
    populateTreatmentForms(emrPrescribedTreatmentsContainer, doc.treatmentPlan?.prescribed || []);
    populateSelectableList(emrSuggestedTreatments, doc.treatmentPlan?.suggested || [], 'treatment');
    
    // Procedures
    populateProcedureForms(emrPerformedProceduresContainer, doc.procedures?.performed || []);
    populateSelectableList(emrSuggestedProcedures, doc.procedures?.suggested || [], 'procedure');
    
    // Follow-up
    if (doc.followUp) {
        emrFollowUpTiming.value = doc.followUp.timing || '';
        emrFollowUpInstructions.value = doc.followUp.instructions || '';
        
        // Referrals
        populateReferralForms(emrReferralsContainer, doc.followUp.referrals || []);
    }
}

/**
 * Populate assessment form items
 */
function populateAssessmentForms(container, assessments) {
    // Clear existing content
    container.innerHTML = '';
    
    if (assessments.length === 0) {
        // Add a blank form if no assessments
        addEmrFormItem('assessment');
        return;
    }
    
    // Add a form for each assessment
    assessments.forEach(assessment => {
        const assessmentItem = document.createElement('div');
        assessmentItem.className = 'assessment-form-item';
        
        assessmentItem.innerHTML = `
            <div class="assessment-form-row">
                <input type="text" class="diagnosis-input" placeholder="Diagnosis" value="${assessment.diagnosis || ''}">
                <input type="text" class="icd-input" placeholder="ICD Code" value="${assessment.icdCode || ''}">
            </div>
            <textarea class="evidence-input" placeholder="Clinical evidence">${assessment.clinicalEvidence || ''}</textarea>
            <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
        `;
        
        container.appendChild(assessmentItem);
    });
}

/**
 * Populate medication form items
 */
function populateMedicationForms(container, medications) {
    // Clear existing content
    container.innerHTML = '';
    
    if (medications.length === 0) {
        // Add a blank form if no medications
        addEmrFormItem('medication');
        return;
    }
    
    // Add a form for each medication
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
        
        container.appendChild(medItem);
    });
}

/**
 * Populate treatment form items
 */
function populateTreatmentForms(container, treatments) {
    // Clear existing content
    container.innerHTML = '';
    
    if (treatments.length === 0) {
        // Add a blank form if no treatments
        addEmrFormItem('treatment');
        return;
    }
    
    // Add a form for each treatment
    treatments.forEach(treatment => {
        const treatmentItem = document.createElement('div');
        treatmentItem.className = 'treatment-form-item';
        
        treatmentItem.innerHTML = `
            <input type="text" class="treatment-name" placeholder="Treatment" value="${treatment.treatment || ''}">
            <textarea class="treatment-instructions" placeholder="Instructions">${treatment.instructions || ''}</textarea>
            <input type="text" class="treatment-duration" placeholder="Duration" value="${treatment.duration || ''}">
            <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
        `;
        
        container.appendChild(treatmentItem);
    });
}

/**
 * Populate procedure form items
 */
function populateProcedureForms(container, procedures) {
    // Clear existing content
    container.innerHTML = '';
    
    if (procedures.length === 0) {
        // Add a blank form if no procedures
        addEmrFormItem('procedure');
        return;
    }
    
    // Add a form for each procedure
    procedures.forEach(procedure => {
        const procedureItem = document.createElement('div');
        procedureItem.className = 'procedure-form-item';
        
        procedureItem.innerHTML = `
            <div class="procedure-form-row">
                <input type="text" class="procedure-name" placeholder="Procedure name" value="${procedure.name || ''}">
                <input type="text" class="cpt-code" placeholder="CPT Code" value="${procedure.cptCode || ''}">
            </div>
            <textarea class="procedure-notes" placeholder="Notes">${procedure.notes || ''}</textarea>
            <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
        `;
        
        container.appendChild(procedureItem);
    });
}

/**
 * Populate referral form items
 */
function populateReferralForms(container, referrals) {
    // Clear existing content
    container.innerHTML = '';
    
    if (referrals.length === 0) {
        // Add a blank form if no referrals
        addEmrFormItem('referral');
        return;
    }
    
    // Add a form for each referral
    referrals.forEach(referral => {
        const referralItem = document.createElement('div');
        referralItem.className = 'referral-form-item';
        
        referralItem.innerHTML = `
            <input type="text" class="referral-speciality" placeholder="Speciality" value="${referral.speciality || ''}">
            <input type="text" class="referral-reason" placeholder="Reason" value="${referral.reason || ''}">
            <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
        `;
        
        container.appendChild(referralItem);
    });
}

/**
 * Add a new form item of the specified type
 */
function addEmrFormItem(type) {
    let container, html;
    
    switch (type) {
        case 'assessment':
            container = emrAssessmentsContainer;
            html = `
                <div class="assessment-form-item">
                    <div class="assessment-form-row">
                        <input type="text" class="diagnosis-input" placeholder="Diagnosis">
                        <input type="text" class="icd-input" placeholder="ICD Code">
                    </div>
                    <textarea class="evidence-input" placeholder="Clinical evidence"></textarea>
                    <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
                </div>
            `;
            break;
            
        case 'medication':
            container = emrPrescribedMedsContainer;
            html = `
                <div class="medication-form-item">
                    <input type="text" class="med-name" placeholder="Medication name">
                    <div class="med-details">
                        <input type="text" class="med-dosage" placeholder="Dosage">
                        <input type="text" class="med-frequency" placeholder="Frequency">
                        <input type="text" class="med-duration" placeholder="Duration">
                    </div>
                    <textarea class="med-instructions" placeholder="Instructions"></textarea>
                    <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
                </div>
            `;
            break;
            
        case 'treatment':
            container = emrPrescribedTreatmentsContainer;
            html = `
                <div class="treatment-form-item">
                    <input type="text" class="treatment-name" placeholder="Treatment">
                    <textarea class="treatment-instructions" placeholder="Instructions"></textarea>
                    <input type="text" class="treatment-duration" placeholder="Duration">
                    <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
                </div>
            `;
            break;
            
        case 'procedure':
            container = emrPerformedProceduresContainer;
            html = `
                <div class="procedure-form-item">
                    <div class="procedure-form-row">
                        <input type="text" class="procedure-name" placeholder="Procedure name">
                        <input type="text" class="cpt-code" placeholder="CPT Code">
                    </div>
                    <textarea class="procedure-notes" placeholder="Notes"></textarea>
                    <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
                </div>
            `;
            break;
            
        case 'referral':
            container = emrReferralsContainer;
            html = `
                <div class="referral-form-item">
                    <input type="text" class="referral-speciality" placeholder="Speciality">
                    <input type="text" class="referral-reason" placeholder="Reason">
                    <button class="remove-item-btn" onclick="removeFormItem(this)">Remove</button>
                </div>
            `;
            break;
    }
    
    if (container && html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        container.appendChild(tempDiv.firstElementChild);
    }
}

/**
 * Remove a form item
 */
function removeFormItem(button) {
    const item = button.closest('.assessment-form-item, .medication-form-item, .treatment-form-item, .procedure-form-item, .referral-form-item');
    if (item) {
        item.remove();
    }
}

/**
 * Save documentation from form fields
 */
function saveDocumentation() {
    // Collect data from form fields
    const documentationData = {
        clinicalDocumentation: {
            chiefComplaint: emrChiefComplaint.value,
            secondaryComplaints: emrSecondaryComplaints.value.split('\n').filter(line => line.trim()),
            historyOfPresentIllness: emrHPI.value,
            pastMedicalHistory: {
                conditions: emrConditions.value.split('\n').filter(line => line.trim()),
                surgeries: emrSurgeries.value.split('\n').filter(line => line.trim()),
                allergies: emrAllergies.value.split('\n').filter(line => line.trim())
            },
            vitalSigns: {
                bloodPressure: emrBP.value,
                heartRate: emrHR.value,
                respiratoryRate: emrRR.value,
                temperature: emrTemp.value,
                oxygenSaturation: emrO2.value,
                height: emrHeight.value,
                weight: emrWeight.value,
                bmi: emrBMI.value
            },
            assessments: collectAssessments(),
            medications: {
                prescribed: collectMedications(),
                suggested: selectedItems.medications
            },
            treatmentPlan: {
                prescribed: collectTreatments(),
                suggested: selectedItems.treatments
            },
            procedures: {
                performed: collectProcedures(),
                suggested: selectedItems.procedures
            },
            followUp: {
                timing: emrFollowUpTiming.value,
                instructions: emrFollowUpInstructions.value,
                referrals: collectReferrals()
            }
        }
    };
    
    // Store the data (in a real app, this would be sent to the server)
    clinicalDocumentation = documentationData;
    
    // Show confirmation alert
    alert('Documentation saved successfully!');
}

/**
 * Collect assessment data from forms
 */
function collectAssessments() {
    const assessments = [];
    const items = emrAssessmentsContainer.querySelectorAll('.assessment-form-item');
    
    items.forEach(item => {
        const diagnosis = item.querySelector('.diagnosis-input').value;
        const icdCode = item.querySelector('.icd-input').value;
        const evidence = item.querySelector('.evidence-input').value;
        
        if (diagnosis || icdCode || evidence) {
            assessments.push({
                diagnosis: diagnosis,
                icdCode: icdCode,
                clinicalEvidence: evidence
            });
        }
    });
    
    return assessments;
}

/**
 * Collect medication data from forms
 */
function collectMedications() {
    const medications = [];
    const items = emrPrescribedMedsContainer.querySelectorAll('.medication-form-item');
    
    items.forEach(item => {
        const name = item.querySelector('.med-name').value;
        
        if (name) {
            medications.push({
                name: name,
                dosage: item.querySelector('.med-dosage').value,
                frequency: item.querySelector('.med-frequency').value,
                duration: item.querySelector('.med-duration').value,
                instructions: item.querySelector('.med-instructions').value
            });
        }
    });
    
    return medications;
}

/**
 * Collect treatment data from forms
 */
function collectTreatments() {
    const treatments = [];
    const items = emrPrescribedTreatmentsContainer.querySelectorAll('.treatment-form-item');
    
    items.forEach(item => {
        const treatment = item.querySelector('.treatment-name').value;
        
        if (treatment) {
            treatments.push({
                treatment: treatment,
                instructions: item.querySelector('.treatment-instructions').value,
                duration: item.querySelector('.treatment-duration').value
            });
        }
    });
    
    return treatments;
}

/**
 * Collect procedure data from forms
 */
function collectProcedures() {
    const procedures = [];
    const items = emrPerformedProceduresContainer.querySelectorAll('.procedure-form-item');
    
    items.forEach(item => {
        const name = item.querySelector('.procedure-name').value;
        
        if (name) {
            procedures.push({
                name: name,
                cptCode: item.querySelector('.cpt-code').value,
                notes: item.querySelector('.procedure-notes').value
            });
        }
    });
    
    return procedures;
}

/**
 * Collect referral data from forms
 */
function collectReferrals() {
    const referrals = [];
    const items = emrReferralsContainer.querySelectorAll('.referral-form-item');
    
    items.forEach(item => {
        const speciality = item.querySelector('.referral-speciality').value;
        
        if (speciality) {
            referrals.push({
                speciality: speciality,
                reason: item.querySelector('.referral-reason').value
            });
        }
    });
    
    return referrals;
}

// Add removeFormItem to the window object to make it globally accessible
window.removeFormItem = removeFormItem;

/**
 * Set up EMR interface buttons
 */
function setupEmrButtons() {
    // Add assessment button
    const addAssessmentBtn = document.getElementById('addAssessmentBtn');
    if (addAssessmentBtn) {
        addAssessmentBtn.addEventListener('click', () => addEmrFormItem('assessment'));
        console.log("Add assessment button event listener attached");
    }
    
    // Add medication button
    const addMedicationBtn = document.getElementById('addMedicationBtn');
    if (addMedicationBtn) {
        addMedicationBtn.addEventListener('click', () => addEmrFormItem('medication'));
        console.log("Add medication button event listener attached");
    }
    
    // Add treatment button
    const addTreatmentBtn = document.getElementById('addTreatmentBtn');
    if (addTreatmentBtn) {
        addTreatmentBtn.addEventListener('click', () => addEmrFormItem('treatment'));
        console.log("Add treatment button event listener attached");
    }
    
    // Add procedure button
    const addProcedureBtn = document.getElementById('addProcedureBtn');
    if (addProcedureBtn) {
        addProcedureBtn.addEventListener('click', () => addEmrFormItem('procedure'));
        console.log("Add procedure button event listener attached");
    }
    
    // Add referral button
    const addReferralBtn = document.getElementById('addReferralBtn');
    if (addReferralBtn) {
        addReferralBtn.addEventListener('click', () => addEmrFormItem('referral'));
        console.log("Add referral button event listener attached");
    }
}

/**
 * Trigger the ClaimKit review process
 * This connects the main app with the ClaimKit integration
 */
function triggerClaimKitReview() {
    // Validate required fields
    if (!validatePatientInfo()) {
        setStatus('Please fill in all required patient information');
        return;
    }
    
    if (!transcription) {
        setStatus('No transcription available');
        return;
    }
    
    // Get the notes
    let doctorNotes = transcription;
    
    // Get patient information
    const patientAge = document.getElementById('patientAge').value || '';
    const patientGender = document.getElementById('patientGender').value || '';
    const visitType = document.getElementById('visitType').value || '';
    const insurancePolicy = document.getElementById('insurancePolicy').value || '';
    
    // Call the handleReviewDocumentation function from claimkit-integration.js
    if (typeof window.handleReviewDocumentation === 'function') {
        // Direct call to the function
        window.handleReviewDocumentation();
    } else {
        // Manually prepare and call the review API
        showLoading('Reviewing documentation...');
        
        // Prepare request parameters
        const params = {
            doctorNotes: doctorNotes,
            patientAge: parseInt(patientAge) || 35,
            patientGender: patientGender || 'male',
            visitType: visitType || 'consultation',
            insurancePolicy: insurancePolicy || ''
        };
        
        console.log('Starting ClaimKit review with data:', params);
        
        // Call the ClaimKit API
        window.claimkitApi.reviewMedicalDocumentation(params)
            .then(result => {
                console.log('Review completed successfully:', result);
                
                // Switch to the ClaimKit tab
                const claimkitTab = document.querySelector('.tab-button[data-tab="claimkit"]');
                if (claimkitTab) {
                    claimkitTab.click();
                }
                
                // Scroll to results section
                const resultsSection = document.getElementById('resultsSection');
                if (resultsSection) {
                    resultsSection.classList.remove('hidden');
                    resultsSection.scrollIntoView({ behavior: 'smooth' });
                }
                
                hideLoading();
                setStatus('Review complete. You can now enhance the notes.');
            })
            .catch(error => {
                console.error('Error reviewing documentation:', error);
                setStatus(`Error: ${error.message}`);
                hideLoading();
            });
    }
}

// Export clinical documentation function
function exportClinicalDocumentation() {
    console.log("Exporting clinical documentation");
    
    if (!clinicalDocumentation) {
        alert("No documentation available to export");
        return;
    }
    
    try {
        // Create a JSON blob
        const docBlob = new Blob(
            [JSON.stringify(clinicalDocumentation, null, 2)], 
            {type: 'application/json'}
        );
        
        // Create download link
        const url = URL.createObjectURL(docBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clinical_documentation_${new Date().toISOString().slice(0,10)}.json`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        setStatus('Documentation exported successfully');
    } catch (error) {
        console.error('Error exporting documentation:', error);
        setStatus(`Export failed: ${error.message}`);
    }
}

// Patient Templates Functionality
function setupTemplateCards() {
    console.log("Setting up template cards");
    const templateCards = document.querySelectorAll('.template-card');
    console.log(`Found ${templateCards.length} template cards`);
    
    if (templateCards.length === 0) {
        console.error("No template cards found! DOM may not be ready.");
        return;
    }
    
    templateCards.forEach(card => {
        console.log(`Adding click listener to card:`, card);
        
        card.addEventListener('click', (event) => {
            console.log("Template card clicked", event.currentTarget);
            
            // Remove selected class from all cards
            templateCards.forEach(c => c.classList.remove('selected'));
            
            // Add selected class to clicked card
            card.classList.add('selected');
            
            // Get data attributes
            const age = card.getAttribute('data-age');
            const gender = card.getAttribute('data-gender');
            const visitTypeValue = card.getAttribute('data-visit');
            
            console.log(`Template values: age=${age}, gender=${gender}, visitType=${visitTypeValue}`);
            
            // Set values in form fields - direct DOM access to ensure reliability
            const ageField = document.getElementById('patientAge');
            const genderField = document.getElementById('patientGender');
            const visitTypeField = document.getElementById('visitType');
            
            if (ageField) {
                ageField.value = age;
                console.log(`Set age field to: ${age}`);
                // Trigger change event
                const event = new Event('change', { bubbles: true });
                ageField.dispatchEvent(event);
            } else {
                console.error("Age field not found");
            }
            
            if (genderField) {
                genderField.value = gender;
                console.log(`Set gender field to: ${gender}`);
                // Trigger change event
                const event = new Event('change', { bubbles: true });
                genderField.dispatchEvent(event);
            } else {
                console.error("Gender field not found");
            }
            
            if (visitTypeField) {
                visitTypeField.value = visitTypeValue;
                console.log(`Set visit type field to: ${visitTypeValue}`);
                // Trigger change event
                const event = new Event('change', { bubbles: true });
                visitTypeField.dispatchEvent(event);
            } else {
                console.error("Visit type field not found");
            }
            
            // Enable the next button if all required fields are filled
            const nextButton = document.getElementById('nextToStep3');
            if (nextButton) {
                const isValid = ageField && ageField.value && 
                               genderField && genderField.value && 
                               visitTypeField && visitTypeField.value;
                               
                nextButton.disabled = !isValid;
                console.log(`Next button ${isValid ? 'enabled' : 'still disabled'}`);
            }
        });
    });
}

// Claims Dashboard Modal Functionality
function setupClaimsDashboardModal() {
    console.log("Setting up claims dashboard modal");
    const modal = document.getElementById('claimsDashboardModal');
    const closeBtn = document.getElementById('closeClaimsModal');
    const stayHereBtn = document.getElementById('stayHereBtn');
    const gotoDashboardBtn = document.getElementById('gotoDashboardBtn');
    
    if (!modal) {
        console.error("Claims dashboard modal element not found!");
        return;
    }
    
    // Function to show modal
    window.showClaimsDashboardModal = function() {
        console.log("Showing claims dashboard modal");
        if (modal) {
            modal.classList.add('active');
            console.log("Modal active class added:", modal.classList.contains('active'));
            
            // Add debugging information
            console.log("Modal element:", modal);
            console.log("Modal style display:", window.getComputedStyle(modal).display);
            console.log("Modal style visibility:", window.getComputedStyle(modal).visibility);
            console.log("Modal style opacity:", window.getComputedStyle(modal).opacity);
            
            // Force re-rendering
            modal.style.display = 'flex';
            setTimeout(() => {
                console.log("Modal display after timeout:", window.getComputedStyle(modal).display);
            }, 100);
        } else {
            console.error("Modal element is null when trying to show it");
        }
    };
    
    // Function to hide modal
    function hideClaimsDashboardModal() {
        console.log("Hiding claims dashboard modal");
        if (modal) {
            modal.classList.remove('active');
            
            // For extra reliability, also reset the display property after animation completes
            setTimeout(() => {
                if (!modal.classList.contains('active')) {
                    modal.style.display = '';
                }
            }, 300); // Animation duration is typically 300ms
        } else {
            console.error("Modal element is null when trying to hide it");
        }
    }
    
    // Close button event
    if (closeBtn) {
        closeBtn.addEventListener('click', hideClaimsDashboardModal);
    } else {
        console.warn("Close button not found for claims dashboard modal");
    }
    
    // Stay here button event
    if (stayHereBtn) {
        stayHereBtn.addEventListener('click', hideClaimsDashboardModal);
    } else {
        console.warn("Stay here button not found for claims dashboard modal");
    }
    
    // Go to dashboard button event
    if (gotoDashboardBtn) {
        gotoDashboardBtn.addEventListener('click', () => {
            // Redirect to dashboard (placeholder URL)
            window.open('https://dashboard.claimkit.ai', '_blank');
            hideClaimsDashboardModal();
        });
    } else {
        console.warn("Go to dashboard button not found for claims dashboard modal");
    }
    
    // For testing, add a global trigger function
    window.testShowModal = function() {
        window.showClaimsDashboardModal();
    };
    
    console.log("Claims dashboard modal setup complete");
} 