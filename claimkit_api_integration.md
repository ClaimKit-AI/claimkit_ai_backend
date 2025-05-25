# ClaimKit API Integration Documentation

## Overview

This document provides comprehensive details on integrating with the ClaimKit AI service deployed at stingray-app. It covers all API endpoints, request/response formats, and examples to help your Voice to Notes agent connect seamlessly to the service.

## Base URL

```
https://stingray-app-hnhkb.ondigitalocean.app
```

## API Endpoints

All endpoints use the `/claimkit/` path prefix. The following endpoints are available:

| Endpoint | Purpose | HTTP Method |
|----------|---------|-------------|
| `/claimkit/insurance_claim_review/history` | Review medical documentation for compliance issues | POST |
| `/claimkit/doctor_notes/improve` | Enhance doctor notes with structured information | POST |
| `/claimkit/insurance_claim/write` | Generate an insurance claim from medical notes | POST |
| `/claimkit/claim/denial_management` | Create corrected claims after denial | POST |

## Request Format

All requests use POST method with JSON body. The Content-Type header should be `application/json`.

## Authentication

No authentication is currently required for these endpoints. However, be aware that this might change in production versions.

## Endpoint Details

### 1. Review Medical Documentation

**Endpoint:** `/claimkit/insurance_claim_review/history`

**Purpose:** Analyze doctor notes to identify issues or gaps

**Request Body:**
```json
{
  "claim": {
    "doctor_notes": "Patient clinical notes here",
    "general_agreement": "Insurance agreement text",
    "insurance_policy_details": "Insurance policy details",
    "claimkit_review_rules_id": "doctornotes_review_criteria",
    "history": "Patient history notes"
  },
  "model_name": "chatgpt-4o-latest",
  "temperature": 0.3,
  "max_tokens": 16000
}
```

**Response:** 
The response contains a JSON object with review feedback and analysis. Key fields include:
- `data.total_review_feedback_json_list`: Array of feedback items with categories and detailed analysis

### 2. Enhance Doctor Notes

**Endpoint:** `/claimkit/doctor_notes/improve`

**Purpose:** Structure and enhance clinical notes

**Request Body:**
```json
{
  "initial_claim": "Original doctor notes",
  "feedback": "Optional feedback from review",
  "patient_insurance_policy": "Insurance policy details",
  "insurance_general_agreement": "Insurance agreement text",
  "doctor_note_template": "doctor_notes_template_no_codes",
  "model_name": "chatgpt-4o-latest",
  "temperature": 0.4,
  "max_tokens": 16000
}
```

**Response:** 
The response contains a JSON object with structured and enhanced notes. Key fields include:
- `data.data.improved_notes`: Enhanced and structured version of the original notes

### 3. Generate Insurance Claim

**Endpoint:** `/claimkit/insurance_claim/write`

**Purpose:** Create a formatted insurance claim from notes

**Request Body:**
```json
{
  "enhanced_notes": "Doctor notes (enhanced or original)",
  "patient_insurance_policy": "Insurance policy details",
  "insurance_general_agreement": "Insurance agreement text",
  "insurance_claim_template": "insurance_claim_template",
  "model_name": "chatgpt-4o-latest",
  "temperature": 0.3,
  "max_tokens": 16000
}
```

**Response:** 
The response contains a JSON object with a formatted insurance claim. Key fields include:
- `data.data.generated_claim`: The structured claim document

### 4. Handle Claim Denial

**Endpoint:** `/claimkit/claim/denial_management`

**Purpose:** Create corrected claims after a denial

**Request Body:**
```json
{
  "original_claim": "Original doctor notes",
  "denial_reason": "Reason for claim denial",
  "enhanced_doctor_notes": "Doctor notes (enhanced or original)",
  "patient_history": "Patient history notes",
  "patient_insurance_policy": "Insurance policy details",
  "insurance_general_agreement": "Insurance agreement text",
  "template_id": "denial_management",
  "model": "chatgpt-4o-latest",
  "max_tokens": 16000
}
```

**Response:** 
The response contains a JSON object with a corrected claim addressing denial reasons. Key fields include:
- `data.corrected_claim`: The updated claim document designed to address the denial reason

## Integration Examples

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

async function reviewMedicalDocumentation(doctorNotes, insurancePolicy, generalAgreement, patientHistory) {
  try {
    const response = await axios.post(
      'https://stingray-app-hnhkb.ondigitalocean.app/claimkit/insurance_claim_review/history',
      {
        claim: {
          doctor_notes: doctorNotes,
          general_agreement: generalAgreement,
          insurance_policy_details: insurancePolicy,
          claimkit_review_rules_id: "doctornotes_review_criteria",
          history: patientHistory
        },
        model_name: "chatgpt-4o-latest",
        temperature: 0.3,
        max_tokens: 16000
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error reviewing documentation:', error);
    throw error;
  }
}
```

### Python Example

```python
import requests
import json

def review_medical_documentation(doctor_notes, insurance_policy, general_agreement, patient_history):
    url = "https://stingray-app-hnhkb.ondigitalocean.app/claimkit/insurance_claim_review/history"
    
    payload = {
        "claim": {
            "doctor_notes": doctor_notes,
            "general_agreement": general_agreement,
            "insurance_policy_details": insurance_policy,
            "claimkit_review_rules_id": "doctornotes_review_criteria",
            "history": patient_history
        },
        "model_name": "chatgpt-4o-latest",
        "temperature": 0.3,
        "max_tokens": 16000
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        response.raise_for_status()  # Raise exception for HTTP errors
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error reviewing documentation: {e}")
        raise
```

## Voice to Notes Integration Flow

For your Voice to Notes project, implement the following flow:

1. **Capture and Transcribe Voice**: 
   - Use speech-to-text service to transcribe doctor's spoken notes

2. **Process Transcription**:
   - Clean and format the transcribed text
   - Add any additional context needed (patient info, etc.)

3. **Send to ClaimKit API**:
   - Use the appropriate endpoint based on your needs:
     - `/claimkit/doctor_notes/improve` to structure raw transcriptions
     - `/claimkit/insurance_claim_review/history` to check for compliance issues
     - `/claimkit/insurance_claim/write` to generate a claim from the notes

4. **Handle and Display Results**:
   - Process the API response
   - Display structured results to the user
   - Allow editing or confirmation before final submission

## Complete Integration Example for Voice to Notes

```javascript
// Voice to Notes Integration Example
async function processVoiceTranscription(transcribedNote, patientInfo = {}) {
  try {
    // Prepare default values for required fields
    const defaultInsurancePolicy = "Standard health insurance policy covering primary care visits and basic procedures.";
    const defaultAgreement = "General agreement between patient and healthcare provider regarding services and insurance coverage.";
    
    // Optional: Add patient context to the transcribed note
    const enhancedTranscription = addPatientContext(transcribedNote, patientInfo);
    
    // Step 1: Send the transcribed note for enhancement
    const enhanceResponse = await enhanceNotes(enhancedTranscription, defaultInsurancePolicy, defaultAgreement);
    
    // Step 2: Send the enhanced notes for review
    const reviewResponse = await reviewMedicalDocumentation(
      enhanceResponse.data.data.improved_notes,
      defaultInsurancePolicy,
      defaultAgreement,
      patientInfo.history || ""
    );
    
    // Step 3: Generate a claim based on the enhanced notes
    const claimResponse = await generateClaim(
      enhanceResponse.data.data.improved_notes,
      defaultInsurancePolicy,
      defaultAgreement
    );
    
    // Return all responses to display to the user
    return {
      originalTranscription: transcribedNote,
      enhancedNotes: enhanceResponse.data.data.improved_notes,
      reviewFeedback: reviewResponse.data.total_review_feedback_json_list,
      generatedClaim: claimResponse.data.data.generated_claim
    };
  } catch (error) {
    console.error('Error processing voice transcription:', error);
    throw error;
  }
}

// Helper function to add patient context to transcription
function addPatientContext(transcription, patientInfo) {
  if (Object.keys(patientInfo).length === 0) return transcription;
  
  const context = `Patient is a ${patientInfo.age || 'adult'} ${patientInfo.gender || 'person'} `;
  
  // Only prepend context if it's not already in the transcription
  if (!transcription.toLowerCase().includes('patient is a')) {
    return context + transcription;
  }
  return transcription;
}

// Function to enhance doctor notes
async function enhanceNotes(doctorNotes, insurancePolicy, generalAgreement) {
  const response = await axios.post(
    'https://stingray-app-hnhkb.ondigitalocean.app/claimkit/doctor_notes/improve',
    {
      initial_claim: doctorNotes,
      feedback: "",
      patient_insurance_policy: insurancePolicy,
      insurance_general_agreement: generalAgreement,
      doctor_note_template: "doctor_notes_template_no_codes",
      model_name: "chatgpt-4o-latest",
      temperature: 0.4,
      max_tokens: 16000
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response;
}

// Function to generate an insurance claim
async function generateClaim(enhancedNotes, insurancePolicy, generalAgreement) {
  const response = await axios.post(
    'https://stingray-app-hnhkb.ondigitalocean.app/claimkit/insurance_claim/write',
    {
      enhanced_notes: enhancedNotes,
      patient_insurance_policy: insurancePolicy,
      insurance_general_agreement: generalAgreement,
      insurance_claim_template: "insurance_claim_template",
      model_name: "chatgpt-4o-latest",
      temperature: 0.3,
      max_tokens: 16000
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response;
}
```

## Error Handling

The API may return errors with the following status codes:

- `400`: Bad Request - Invalid or missing parameters
- `500`: Internal Server Error - Something went wrong on the server

Always implement error handling to provide feedback to users when API calls fail:

```javascript
try {
  const response = await axios.post(apiUrl, requestData, { headers });
  return response.data;
} catch (error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error(`API Error: ${error.response.status}`, error.response.data);
    throw new Error(`API Error ${error.response.status}: ${error.response.data.message || 'Unknown error'}`);
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response received from API', error.request);
    throw new Error('No response received from server. Please check your network connection.');
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error setting up request', error.message);
    throw error;
  }
}
```

## Response Processing

Responses from the API include nested JSON structures. Key elements to extract:

| Endpoint | Key Response Fields |
|----------|---------------------|
| Review | `data.total_review_feedback_json_list` |
| Enhance | `data.data.improved_notes` |
| Generate | `data.data.generated_claim` |
| Denial | `data.corrected_claim` |

## Performance Considerations

1. **Response Time**: API calls may take 5-30 seconds to complete. Implement appropriate loading UI with the animated messages provided in the demo application.

2. **Error Handling**: Always implement comprehensive error handling to provide feedback to users.

3. **Caching**: Consider caching responses for identical inputs to reduce API calls.

4. **Progressive Loading**: Show partial results as they become available if using multiple API calls in sequence.

## Additional Notes

1. **Model Selection**: Always use "chatgpt-4o-latest" for best results
2. **Template IDs**: Use the template IDs exactly as specified in the examples
3. **Request Size Limits**: The total size of the request body should not exceed 100KB
4. **Rate Limiting**: There may be rate limits in place. Implement exponential backoff for retries

## Sample Voice to Notes Implementation Workflow

1. **Capture Audio**: Record doctor's voice notes
2. **Transcribe**: Convert speech to text
3. **Pre-process**: Clean and format the transcription
4. **Enhance**: Send to `/claimkit/doctor_notes/improve` endpoint
5. **Review**: Analyze with `/claimkit/insurance_claim_review/history` endpoint
6. **Display**: Show enhanced notes and review feedback
7. **Generate**: Create claim with `/claimkit/insurance_claim/write` endpoint
8. **Finalize**: Allow user to review and submit

---

For additional support or questions, please contact the development team. 