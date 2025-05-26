/**
 * Medical Travel Report Chatbot
 * A floating chatbot that helps generate medical travel reports
 * with OpenAI integration for natural language processing
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the chatbot
  initChatbot();
});

/**
 * Initialize the chatbot
 */
function initChatbot() {
  const chatbotContainer = document.getElementById('travelReportChatbot');
  const chatbotToggle = document.getElementById('chatbotToggle');
  
  if (!chatbotContainer || !chatbotToggle) return;
  
  // Create chatbot window
  const chatbotWindow = document.createElement('div');
  chatbotWindow.className = 'chatbot-window';
  
  // Create chatbot header
  const chatbotHeader = document.createElement('div');
  chatbotHeader.className = 'chatbot-header';
  chatbotHeader.innerHTML = `
    <div class="chatbot-title">
      <i class="fas fa-plane-departure"></i>
      <span>Travel Report Assistant</span>
    </div>
    <div class="chatbot-header-actions">
      <button class="chatbot-action-btn" id="chatbotClearBtn" title="Clear chat">
        <i class="fas fa-trash"></i>
      </button>
      <button class="chatbot-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  // Create chatbot body
  const chatbotBody = document.createElement('div');
  chatbotBody.className = 'chatbot-body';
  
  // Create chatbot input area
  const chatbotFooter = document.createElement('div');
  chatbotFooter.className = 'chatbot-footer';
  chatbotFooter.innerHTML = `
    <div class="chatbot-input-container">
      <input type="text" class="chatbot-input" placeholder="Ask about travel health or select a patient...">
      <button class="chatbot-send" disabled>
        <i class="fas fa-paper-plane"></i>
      </button>
    </div>
  `;
  
  // Append all elements
  chatbotWindow.appendChild(chatbotHeader);
  chatbotWindow.appendChild(chatbotBody);
  chatbotWindow.appendChild(chatbotFooter);
  chatbotContainer.appendChild(chatbotWindow);
  
  // Use event delegation for all button clicks in the chatbot
  chatbotBody.addEventListener('click', function(e) {
    // Find the button that was clicked
    const button = e.target.closest('.chatbot-option, .chatbot-btn');
    if (!button) return; // Not a button click
    
    console.log('Chatbot button clicked:', button.textContent.trim());
    
    // Handle different button types based on data attributes or content
    if (button.getAttribute('data-action') === 'select-patient' || button.textContent.includes('Select Patient')) {
      console.log('Select patient action triggered');
      e.preventDefault();
      displayUserMessage("Select patient");
      displayBotMessage("Let's find a patient for the travel report. Please select from the list:");
      showPatientSelector();
    }
    else if (button.getAttribute('data-action') === 'ask-question' || button.textContent.includes('Ask a Question')) {
      console.log('Ask question action triggered');
      e.preventDefault();
      displayUserMessage("I'd like to ask a question");
      displayBotMessage("What would you like to know about travel medicine or health concerns while traveling?");
    }
    else if (button.getAttribute('data-patient-id')) {
      // Patient selection button
      e.preventDefault();
      const patientId = button.getAttribute('data-patient-id');
      const isEligible = button.getAttribute('data-eligible') === 'true';
      const patientName = button.textContent.trim().split(' (')[0];
      handlePatientSelection(patientId, patientName, isEligible);
    }
    else if (button.getAttribute('data-language')) {
      // Language selection button
      e.preventDefault();
      const languageCode = button.getAttribute('data-language');
      const languageName = button.textContent.trim();
      handleLanguageSelection(languageCode, languageName);
    }
    else if (button.getAttribute('data-action') === 'generate-report' || button.textContent.includes('Generate Travel Report')) {
      console.log('Generate report action triggered');
      e.preventDefault();
      displayUserMessage("Generate travel report");
      displayBotMessage("Please select a language for the report:");
      showLanguageSelector();
    }
    else if (button.getAttribute('data-action') === 'patient-info' || button.textContent.includes('View Patient Info')) {
      console.log('Patient info action triggered');
      e.preventDefault();
      displayUserMessage("View patient info");
      if (window.selectedPatient) {
        displayPatientInfo(window.selectedPatient);
      } else {
        displayBotMessage("Sorry, patient information is not available. Please select a patient first.");
      }
    }
    else if (button.getAttribute('data-action') === 'download-pdf') {
      console.log('Download PDF action triggered');
      e.preventDefault();
      if (window.reportData && window.selectedPatient) {
        generatePDF(window.reportData, window.selectedPatient.name || 'Patient');
      } else {
        displayBotMessage("Unable to download PDF. Report data or patient information is missing.");
      }
    }
  });
  
  // Toggle chatbot visibility
  chatbotToggle.addEventListener('click', function() {
    chatbotWindow.classList.toggle('active');
    
    // Hide notification when opened
    const notification = chatbotToggle.querySelector('.chatbot-notification');
    if (notification) {
      notification.style.display = 'none';
    }
    
    // Focus input field when opened
    setTimeout(() => {
      const inputField = chatbotFooter.querySelector('.chatbot-input');
      if (inputField && chatbotWindow.classList.contains('active')) {
        inputField.focus();
      }
    }, 300);
    
    // If first time opening, show welcome message
    if (chatbotBody.querySelectorAll('.chatbot-message').length === 0) {
      setTimeout(() => {
        displayBotMessage("👋 Hello! I'm your Medical Travel Report Assistant powered by AI. I can help you generate travel medical reports and answer travel medicine questions.");
        setTimeout(() => {
          displayBotMessage("You can select a patient to generate a report or ask me any travel health-related question. For example, you can ask about travel vaccinations, managing chronic conditions while traveling, or specific destination health concerns.");
          setTimeout(() => {
            displayBotMessage("Would you like to select a patient from your database or ask a question?");
            setTimeout(() => {
              displayQuickOptions();
            }, 500);
          }, 1000);
        }, 1000);
      }, 300);
    }
  });
  
  // Helper function to handle patient selection
  function handlePatientSelection(patientId, patientName, isEligible) {
    console.log(`Handling patient selection: ${patientName}, ID: ${patientId}, Eligible: ${isEligible}`);
    
    // Fetch patient data first to get full details
    fetch(`/api/v1/travel-report/patients/${patientId}/eligibility`)
      .then(response => response.json())
      .then(data => {
        const patient = data.data.patient;
        const isActuallyEligible = data.data.isEligible;
        
        if (!isActuallyEligible) {
          // Patient not eligible
          displayUserMessage(`Select patient: ${patientName}`);
          displayBotMessage(`I'm sorry, but ${patientName} is not eligible for a travel report. ${data.data.reason}.`);
          displayBotMessage("The patient must have visited within the last 6 months to be eligible for a travel report. Would you like to select another patient?");
          
          const optionsHtml = `
            <div class="chatbot-options">
              <button class="chatbot-option" data-action="select-patient">
                <i class="fas fa-user-plus"></i> Select Another Patient
              </button>
              <button class="chatbot-option" data-action="ask-question">
                <i class="fas fa-question-circle"></i> Ask a Question
              </button>
            </div>
          `;
          
          displayBotMessage(optionsHtml);
          return;
        }
        
        // Patient is eligible
        displayUserMessage(`Select patient: ${patientName}`);
        window.selectedPatientId = patientId;
        window.selectedPatient = patient;
        
        displayBotMessage(`I've selected ${patientName} as the patient. What would you like to do next?`);
        
        // Show action options for the selected patient
        setTimeout(() => {
          const patientActionsHtml = `
            <div class="chatbot-options">
              <button class="chatbot-option" data-action="generate-report">
                <i class="fas fa-file-medical"></i> Generate Travel Report
              </button>
              <button class="chatbot-option" data-action="patient-info">
                <i class="fas fa-info-circle"></i> View Patient Info
              </button>
            </div>
          `;
          
          displayBotMessage(patientActionsHtml);
        }, 500);
      })
      .catch(error => {
        console.error('Error checking patient eligibility:', error);
        displayBotMessage("I'm sorry, I encountered an error checking if this patient is eligible for a travel report. Please try again later.");
      });
  }
  
  // Helper function to handle language selection
  function handleLanguageSelection(languageCode, languageName) {
    displayUserMessage(`Language: ${languageName}`);
    
    if (window.selectedPatient) {
      displayBotMessage(`Thank you! I'll generate a medical travel report in ${languageName} for ${window.selectedPatient.name}. This might take a moment...`);
      // Generate the report
      generateTravelReport(window.selectedPatientId, languageCode);
    } else {
      displayBotMessage("Please select a patient first before choosing a language.");
      showPatientSelector();
    }
  }
  
  // Clear chat
  const clearButton = chatbotHeader.querySelector('#chatbotClearBtn');
  clearButton.addEventListener('click', function(e) {
    e.stopPropagation();
    
    // Clear all messages except the first welcome messages
    const messages = chatbotBody.querySelectorAll('.chatbot-message');
    if (messages.length > 3) {
      // Keep the first 3 welcome messages
      for (let i = 3; i < messages.length; i++) {
        chatbotBody.removeChild(messages[i]);
      }
      
      // Show the quick options again
      displayQuickOptions();
    }
    
    // Reset selected patient
    window.selectedPatientId = null;
    window.selectedPatient = null;
  });
  
  // Close chatbot
  const closeButton = chatbotHeader.querySelector('.chatbot-close');
  closeButton.addEventListener('click', function(e) {
    e.stopPropagation();
    chatbotWindow.classList.remove('active');
  });
  
  // Send message on click
  const sendButton = chatbotFooter.querySelector('.chatbot-send');
  const inputField = chatbotFooter.querySelector('.chatbot-input');
  
  // Enable/disable send button based on input
  inputField.addEventListener('input', function() {
    sendButton.disabled = inputField.value.trim() === '';
  });
  
  sendButton.addEventListener('click', function() {
    sendMessage();
  });
  
  inputField.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  function sendMessage() {
    const message = inputField.value.trim();
    if (message) {
      displayUserMessage(message);
      inputField.value = '';
      sendButton.disabled = true;
      
      // Process the message
      processUserMessage(message);
    }
  }
  
  function displayUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chatbot-message user';
    messageElement.textContent = message;
    chatbotBody.appendChild(messageElement);
    scrollToBottom();
  }
  
  function displayBotMessage(message) {
    // First show the typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    chatbotBody.appendChild(typingIndicator);
    scrollToBottom();
    
    // Then after a short delay, replace with the actual message
    setTimeout(() => {
      chatbotBody.removeChild(typingIndicator);
      
      const messageElement = document.createElement('div');
      messageElement.className = 'chatbot-message bot';
      messageElement.innerHTML = message;
      chatbotBody.appendChild(messageElement);
      scrollToBottom();
    }, 1000);
  }
  
  function displayQuickOptions() {
    const quickOptionsHtml = `
      <div class="chatbot-options">
        <button class="chatbot-option" data-action="select-patient">
          <i class="fas fa-user-plus"></i> Select Patient
        </button>
        <button class="chatbot-option" data-action="ask-question">
          <i class="fas fa-question-circle"></i> Ask Question
        </button>
      </div>
    `;
    
    displayBotMessage(quickOptionsHtml);
  }
  
  function scrollToBottom() {
    chatbotBody.scrollTop = chatbotBody.scrollHeight;
  }
  
  async function processUserMessage(message) {
    // Check if a patient is selected
    if (window.selectedPatientId && window.selectedPatient) {
      if (message.toLowerCase().includes('generate report') || 
          message.toLowerCase().includes('create report') || 
          message.toLowerCase().includes('make a report') ||
          message.toLowerCase().includes('travel report')) {
        // Check patient eligibility before showing language selection
        try {
          const response = await fetch(`/api/v1/travel-report/patients/${window.selectedPatientId}/eligibility`);
          
          if (!response.ok) {
            throw new Error('Failed to check patient eligibility');
          }
          
          const data = await response.json();
          
          if (data.data.isEligible) {
            displayBotMessage(`Great! I'll create a travel report for ${window.selectedPatient.name}. Please select a language:`);
            showLanguageSelector();
          } else {
            displayBotMessage(`I'm sorry, but I cannot generate a travel report for ${window.selectedPatient.name}. ${data.data.reason}.`);
            displayBotMessage("The patient must have visited within the last 6 months to be eligible for a travel report. Would you like to select another patient?");
            
            const optionsHtml = `
              <div class="chatbot-options">
                <button class="chatbot-option" data-action="select-patient">
                  <i class="fas fa-user-plus"></i> Select Another Patient
                </button>
                <button class="chatbot-option" data-action="ask-question">
                  <i class="fas fa-question-circle"></i> Ask a Question
                </button>
              </div>
            `;
            
            displayBotMessage(optionsHtml);
            
            // Add event listeners to the options
            setTimeout(() => {
              const options = document.querySelectorAll('.chatbot-option[data-action]');
              options.forEach(option => {
                option.addEventListener('click', function() {
                  const action = this.getAttribute('data-action');
                  
                  if (action === 'select-patient') {
                    displayUserMessage("Select another patient");
                    displayBotMessage("Let's find a patient for the travel report. Please select from the list:");
                    showPatientSelector();
                  } else if (action === 'ask-question') {
                    displayUserMessage("I'd like to ask a question");
                    displayBotMessage("What would you like to know about travel medicine or health concerns while traveling?");
                  }
                });
              });
            }, 100);
          }
        } catch (error) {
          console.error('Error checking patient eligibility:', error);
          displayBotMessage("I'm sorry, I encountered an error checking if this patient is eligible for a travel report. Please try again later.");
        }
        return;
      }
      
      // Process the message as a query about the selected patient
      try {
        const response = await fetch('/api/v1/travel-report/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: message,
            patientId: window.selectedPatientId
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to process query');
        }
        
        const data = await response.json();
        displayBotMessage(data.data.response);
      } catch (error) {
        console.error('Error processing query:', error);
        displayBotMessage("I'm sorry, I encountered an error processing your question. Please try again.");
      }
    } else {
      // Check if the message contains patient selection intent
      if (message.toLowerCase().includes('select patient') || 
          message.toLowerCase().includes('choose patient') || 
          message.toLowerCase().includes('find patient')) {
        displayBotMessage("Let's find a patient for the travel report. Please select from the list:");
        showPatientSelector();
        return;
      }
      
      // Process the message as a general query
      try {
        const response = await fetch('/api/v1/travel-report/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: message
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to process query');
        }
        
        const data = await response.json();
        displayBotMessage(data.data.response);
        
        // Suggest selecting a patient if the response is relevant to travel reports
        if (message.toLowerCase().includes('report') || 
            message.toLowerCase().includes('travel') || 
            message.toLowerCase().includes('document')) {
          setTimeout(() => {
            displayBotMessage("Would you like to generate a travel report for a specific patient?");
            displayQuickOptions();
          }, 1000);
        }
      } catch (error) {
        console.error('Error processing query:', error);
        displayBotMessage("I'm sorry, I encountered an error processing your question. Please try again.");
      }
    }
  }
  
  function showPatientSelector() {
    // Show loading indicator
    displayBotMessage('<div class="loading-message"><i class="fas fa-spinner fa-pulse"></i> Loading patients...</div>');
    
    console.log('Fetching patients from server...');
    
    // Fetch patients from the API
    fetch('/api/v1/travel-report/patients')
      .then(response => {
        if (!response.ok) {
          console.error('Network error when fetching patients:', response.status, response.statusText);
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Patients data received:', data);
        const patients = data.data.patients;
        
        if (!patients || patients.length === 0) {
          displayBotMessage("No patients found. Please try again later.");
          return;
        }
        
        // Remove the loading message
        const loadingElements = document.querySelectorAll('.chatbot-message .loading-message');
        if (loadingElements.length > 0) {
          const loadingMessage = loadingElements[loadingElements.length - 1].closest('.chatbot-message');
          if (loadingMessage) {
            chatbotBody.removeChild(loadingMessage);
          }
        }
        
        // Generate patient list (simplified)
        let patientOptions = `<div class="chatbot-options patient-options">`;
        patients.forEach((patient) => {
          const eligibilityIcon = patient.isEligibleForReport ? 
            '<i class="fas fa-check-circle" style="color: green;" title="Eligible for travel report"></i>' : 
            '<i class="fas fa-exclamation-circle" style="color: red;" title="Not eligible for travel report"></i>';
          
          patientOptions += `
            <button class="chatbot-option ${!patient.isEligibleForReport ? 'ineligible' : ''}" 
                   data-patient-id="${patient.id}" 
                   data-eligible="${patient.isEligibleForReport}">
              ${patient.name} (${patient.age} ${patient.gender}) ${eligibilityIcon}
            </button>
          `;
        });
        patientOptions += `</div>`;
        
        // Add CSS for patient options
        const style = document.createElement('style');
        style.textContent = `
          .chatbot-option.ineligible {
            opacity: 0.7;
            text-decoration: line-through;
            cursor: not-allowed;
          }
          .patient-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .loading-message {
            display: flex;
            align-items: center;
            gap: 10px;
          }
        `;
        document.head.appendChild(style);
        
        displayBotMessage(patientOptions);
      })
      .catch(error => {
        console.error('Error fetching patients:', error);
        displayBotMessage("I'm sorry, I couldn't retrieve the patient list. Please try again later.");
      });
  }
  
  function displayPatientInfo(patient) {
    if (!patient) {
      displayBotMessage("No patient information available.");
      return;
    }

    // Create HTML for patient info card
    const patientInfoHtml = `
      <div class="patient-info-card">
        <h3>${patient.name}</h3>
        <p><strong>Age:</strong> ${patient.age}</p>
        <p><strong>Gender:</strong> ${patient.gender}</p>
        <p><strong>Last Visit:</strong> ${patient.lastVisitDate || 'No recent visits'}</p>
        <p><strong>Eligibility:</strong> ${patient.isEligibleForReport ? 'Eligible for travel report' : 'Not eligible'}</p>
        ${!patient.isEligibleForReport ? `<p><strong>Reason:</strong> ${patient.eligibilityReason}</p>` : ''}
      </div>
      
      <div class="chatbot-options">
        <button class="chatbot-option" data-action="select-another-patient">
          <i class="fas fa-user-plus"></i> Select Another Patient
        </button>
        <button class="chatbot-option" data-action="ask-question">
          <i class="fas fa-question-circle"></i> Ask a Question
        </button>
      </div>
    `;
    
    displayBotMessage(patientInfoHtml);
    
    // Add CSS for patient info card
    const style = document.createElement('style');
    style.textContent = `
      .patient-info-card {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
      }
      .patient-info-card h3 {
        margin-top: 0;
        margin-bottom: 8px;
      }
      .patient-info-card p {
        margin: 4px 0;
      }
    `;
    document.head.appendChild(style);
  }
  
  function showLanguageSelector() {
    const languages = [
      { code: 'en', name: 'English', icon: '🇺🇸' },
      { code: 'es', name: 'Spanish', icon: '🇪🇸' },
      { code: 'fr', name: 'French', icon: '🇫🇷' },
      { code: 'de', name: 'German', icon: '🇩🇪' },
      { code: 'it', name: 'Italian', icon: '🇮🇹' },
      { code: 'zh', name: 'Chinese', icon: '🇨🇳' },
      { code: 'ar', name: 'Arabic', icon: '🇸🇦' },
      { code: 'hi', name: 'Hindi', icon: '🇮🇳' },
      { code: 'pt', name: 'Portuguese', icon: '🇵🇹' },
      { code: 'ru', name: 'Russian', icon: '🇷🇺' }
    ];
    
    // Create language selection options using data-attributes instead of IDs
    let languageOptions = '<div class="chatbot-options language-options">';
    languages.forEach((language) => {
      languageOptions += `
        <button class="chatbot-option" data-language="${language.code}">
          ${language.icon} ${language.name}
        </button>
      `;
    });
    languageOptions += '</div>';
    
    displayBotMessage(languageOptions);
    
    // Add CSS for language options
    const style = document.createElement('style');
    style.textContent = `
      .language-options {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
    `;
    document.head.appendChild(style);
  }
  
  function generateTravelReport(patientId, language) {
    if (!patientId) {
      displayBotMessage("No patient selected. Please select a patient first.");
      return;
    }
    
    // Show loading indicator
    displayBotMessage('<div class="loading-message"><i class="fas fa-spinner fa-pulse"></i> Generating travel report...</div>');
    
    // Call the API to generate the travel report
    fetch(`/api/v1/travel-report/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ patientId, language }),
    })
      .then(response => {
        if (!response.ok) {
          console.error('Network error when generating report:', response.status, response.statusText);
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Travel report generated:', data);
        
        // Remove the loading message
        const loadingElements = document.querySelectorAll('.chatbot-message .loading-message');
        if (loadingElements.length > 0) {
          const loadingMessage = loadingElements[loadingElements.length - 1].closest('.chatbot-message');
          if (loadingMessage) {
            chatbotBody.removeChild(loadingMessage);
          }
        }
        
        // Format the report data properly
        let reportContent = '';
        
        // Check if report is an object and format it
        if (typeof data.data.report === 'object') {
          const report = data.data.report;
          
          // Build formatted report content
          reportContent = `
            <p><strong>Patient:</strong> ${report.patientInfo?.name || 'Not specified'}</p>
            <p><strong>Age:</strong> ${report.patientInfo?.age || 'Not specified'}</p>
            <p><strong>Gender:</strong> ${report.patientInfo?.gender || 'Not specified'}</p>
            
            <h4>Medical History</h4>
            <ul>
              ${Array.isArray(report.medicalHistory) ? 
                report.medicalHistory.map(item => `<li>${item}</li>`).join('') : 
                '<li>No medical history available</li>'}
            </ul>
            
            <h4>Current Conditions</h4>
            <ul>
              ${Array.isArray(report.currentConditions) ? 
                report.currentConditions.map(item => `<li>${item}</li>`).join('') : 
                '<li>No current conditions listed</li>'}
            </ul>
            
            <h4>Medications</h4>
            <ul>
              ${Array.isArray(report.medications) ? 
                report.medications.map(item => `<li>${item}</li>`).join('') : 
                '<li>No medications listed</li>'}
            </ul>
            
            <h4>Allergies</h4>
            <ul>
              ${Array.isArray(report.allergies) ? 
                report.allergies.map(item => `<li>${item}</li>`).join('') : 
                '<li>No allergies listed</li>'}
            </ul>
            
            <h4>Travel Recommendations</h4>
            <ul>
              ${Array.isArray(report.travelRecommendations) ? 
                report.travelRecommendations.map(item => `<li>${item}</li>`).join('') : 
                '<li>No travel recommendations available</li>'}
            </ul>
            
            <h4>Medical Clearance</h4>
            <p>${report.medicalClearance || 'No medical clearance information available'}</p>
            
            ${report.disclaimer ? `<p class="disclaimer">${report.disclaimer}</p>` : ''}
          `;
        } else if (typeof data.data.report === 'string') {
          // If it's already a string, use it directly
          reportContent = data.data.report;
        } else {
          reportContent = 'Report data is in an unexpected format. Please try again.';
        }
        
        // Store report data for download
        window.reportData = data.data.report;
        console.log('Report data stored for PDF:', window.reportData);
        
        // Display the generated report
        const reportHtml = `
          <div class="travel-report">
            <h3>Travel Medical Report</h3>
            <div class="report-content">${reportContent}</div>
            
            <div class="report-actions">
              <button class="chatbot-btn" data-action="download-pdf">
                <i class="fas fa-download"></i> Download as PDF
              </button>
            </div>
          </div>
          
          <div class="chatbot-options">
            <button class="chatbot-option" data-action="select-another-patient">
              <i class="fas fa-user-plus"></i> Select Another Patient
            </button>
            <button class="chatbot-option" data-action="ask-question">
              <i class="fas fa-question-circle"></i> Ask a Question
            </button>
          </div>
        `;
        
        displayBotMessage(reportHtml);
        
        // Add direct click handler for the download button for redundancy
        setTimeout(() => {
          const downloadBtn = document.querySelector('.chatbot-btn[data-action="download-pdf"]');
          if (downloadBtn) {
            downloadBtn.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();  // Prevent event bubbling
              console.log('Download button clicked directly');
              if (window.reportData && window.selectedPatient) {
                generatePDF(window.reportData, window.selectedPatient.name || 'Patient');
              } else {
                displayBotMessage("Unable to download PDF. Report data or patient information is missing.");
              }
            });
          }
        }, 100);
        
        // Add CSS for travel report
        const style = document.createElement('style');
        style.textContent = `
          .travel-report {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
          }
          .travel-report h3 {
            margin-top: 0;
            margin-bottom: 8px;
          }
          .travel-report h4 {
            margin-top: 12px;
            margin-bottom: 6px;
          }
          .report-content {
            white-space: pre-wrap;
          }
          .report-actions {
            margin-top: 15px;
            display: flex;
            justify-content: center;
          }
          .chatbot-btn {
            background-color: #4285f4;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .chatbot-btn:hover {
            background-color: #2b6ed9;
          }
          .disclaimer {
            font-size: 12px;
            font-style: italic;
            color: #666;
            margin-top: 15px;
          }
        `;
        document.head.appendChild(style);
      })
      .catch(error => {
        console.error('Error generating travel report:', error);
        
        // Remove the loading message
        const loadingElements = document.querySelectorAll('.chatbot-message .loading-message');
        if (loadingElements.length > 0) {
          const loadingMessage = loadingElements[loadingElements.length - 1].closest('.chatbot-message');
          if (loadingMessage) {
            chatbotBody.removeChild(loadingMessage);
          }
        }
        
        displayBotMessage("I'm sorry, I couldn't generate the travel report. Please try again later.");
      });
  }
  
  // Add function to generate PDF
  function generatePDF(reportData, patientName) {
    // Show message about preparing PDF
    displayBotMessage("Preparing your PDF for download...");
    
    // Create and download PDF directly
    try {
      console.log("Generating PDF for report data:", reportData);
      
      // Create new PDF document
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add title
      doc.setFontSize(18);
      doc.setTextColor(0, 51, 153);
      doc.text("Medical Travel Report", pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      
      // Format the report data for PDF
      let yPos = 30;
      const lineHeight = 7;
      
      // Add patient info
      if (reportData.patientInfo) {
        doc.setFontSize(14);
        doc.text("Patient Information", 20, yPos);
        doc.setFontSize(12);
        yPos += lineHeight;
        
        doc.text(`Name: ${reportData.patientInfo.name || patientName}`, 20, yPos);
        yPos += lineHeight;
        
        if (reportData.patientInfo.age) {
          doc.text(`Age: ${reportData.patientInfo.age}`, 20, yPos);
          yPos += lineHeight;
        }
        
        if (reportData.patientInfo.gender) {
          doc.text(`Gender: ${reportData.patientInfo.gender}`, 20, yPos);
          yPos += lineHeight;
        }
        
        yPos += lineHeight;
      }
      
      // Add medical history
      if (Array.isArray(reportData.medicalHistory) && reportData.medicalHistory.length > 0) {
        doc.setFontSize(14);
        doc.text("Medical History", 20, yPos);
        doc.setFontSize(12);
        yPos += lineHeight;
        
        reportData.medicalHistory.forEach(item => {
          const lines = doc.splitTextToSize(`• ${item}`, pageWidth - 40);
          lines.forEach(line => {
            doc.text(line, 20, yPos);
            yPos += lineHeight;
          });
        });
        
        yPos += lineHeight;
      }
      
      // Add current conditions
      if (Array.isArray(reportData.currentConditions) && reportData.currentConditions.length > 0) {
        doc.setFontSize(14);
        doc.text("Current Conditions", 20, yPos);
        doc.setFontSize(12);
        yPos += lineHeight;
        
        reportData.currentConditions.forEach(item => {
          const lines = doc.splitTextToSize(`• ${item}`, pageWidth - 40);
          lines.forEach(line => {
            doc.text(line, 20, yPos);
            yPos += lineHeight;
          });
        });
        
        yPos += lineHeight;
      }
      
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Add medications
      if (Array.isArray(reportData.medications) && reportData.medications.length > 0) {
        doc.setFontSize(14);
        doc.text("Medications", 20, yPos);
        doc.setFontSize(12);
        yPos += lineHeight;
        
        reportData.medications.forEach(item => {
          const lines = doc.splitTextToSize(`• ${item}`, pageWidth - 40);
          lines.forEach(line => {
            doc.text(line, 20, yPos);
            yPos += lineHeight;
          });
        });
        
        yPos += lineHeight;
      }
      
      // Add allergies
      if (Array.isArray(reportData.allergies) && reportData.allergies.length > 0) {
        doc.setFontSize(14);
        doc.text("Allergies", 20, yPos);
        doc.setFontSize(12);
        yPos += lineHeight;
        
        reportData.allergies.forEach(item => {
          const lines = doc.splitTextToSize(`• ${item}`, pageWidth - 40);
          lines.forEach(line => {
            doc.text(line, 20, yPos);
            yPos += lineHeight;
          });
        });
        
        yPos += lineHeight;
      }
      
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Add travel recommendations
      if (Array.isArray(reportData.travelRecommendations) && reportData.travelRecommendations.length > 0) {
        doc.setFontSize(14);
        doc.text("Travel Recommendations", 20, yPos);
        doc.setFontSize(12);
        yPos += lineHeight;
        
        reportData.travelRecommendations.forEach(item => {
          const lines = doc.splitTextToSize(`• ${item}`, pageWidth - 40);
          lines.forEach(line => {
            doc.text(line, 20, yPos);
            yPos += lineHeight;
          });
        });
        
        yPos += lineHeight;
      }
      
      // Add medical clearance
      if (reportData.medicalClearance) {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text("Medical Clearance", 20, yPos);
        doc.setFontSize(12);
        yPos += lineHeight;
        
        const lines = doc.splitTextToSize(reportData.medicalClearance, pageWidth - 40);
        lines.forEach(line => {
          doc.text(line, 20, yPos);
          yPos += lineHeight;
        });
        
        yPos += lineHeight;
      }
      
      // Add disclaimer
      if (reportData.disclaimer) {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        
        const lines = doc.splitTextToSize(reportData.disclaimer, pageWidth - 40);
        lines.forEach(line => {
          doc.text(line, 20, yPos);
          yPos += 5;
        });
      }
      
      // Generate filename with patient name and date
      const sanitizedName = (patientName || 'Patient').replace(/[^a-z0-9]/gi, '_');
      const date = new Date().toISOString().split('T')[0];
      const fileName = `Medical_Travel_Report_${sanitizedName}_${date}.pdf`;
      
      // Save the PDF
      doc.save(fileName);
      
      displayBotMessage(`Your report has been downloaded as "${fileName}".`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      displayBotMessage("I'm sorry, I couldn't generate the PDF. Please try again later.");
    }
  }
  
  // Show notification to attract attention
  setTimeout(() => {
    const notification = chatbotToggle.querySelector('.chatbot-notification');
    if (notification) {
      notification.style.display = 'block';
    }
  }, 3000);
}