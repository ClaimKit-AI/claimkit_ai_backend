// EMR Form Functions

// Ensure all DOM elements are properly initialized
document.addEventListener('DOMContentLoaded', () => {
    console.log("EMR functions script loaded");
    
    // Verify that necessary DOM elements exist
    verifyEmrElements();
});

/**
 * Verify EMR elements exist in the DOM
 */
function verifyEmrElements() {
    // Check vital signs elements
    console.log("EMR-BP element exists:", !!document.getElementById('emrBP'));
    console.log("EMR-HR element exists:", !!document.getElementById('emrHR'));
    console.log("EMR-Chief Complaint element exists:", !!document.getElementById('emrChiefComplaint'));
    
    // Check container elements
    console.log("EMR-Assessments Container exists:", !!document.getElementById('emrAssessmentsContainer'));
    console.log("EMR-Medications Container exists:", !!document.getElementById('emrPrescribedMedsContainer'));
}

/**
 * Populate the EMR interface with clinical documentation
 */
function populateEMRInterface(documentation) {
    console.log("Populating EMR interface with data:", documentation);
    
    if (!documentation || !documentation.clinicalDocumentation) {
        console.error("No valid documentation data received");
        alert("No valid documentation data available to populate the EMR view");
        return;
    }
    
    const doc = documentation.clinicalDocumentation;
    
    // Reset selected items
    selectedItems = {
        medications: [],
        treatments: [],
        procedures: []
    };
    
    try {
        // Populate patient info
        console.log("Setting patient info:", patientAge.value, patientGender.value, visitType.value);
        if (emrPatientAge) emrPatientAge.textContent = patientAge.value + ' years';
        if (emrPatientGender) emrPatientGender.textContent = patientGender.value;
        if (emrVisitType) emrVisitType.textContent = visitType.value;
        
        // Chief complaint
        console.log("Setting chief complaint:", doc.chiefComplaint);
        if (emrChiefComplaint) emrChiefComplaint.value = doc.chiefComplaint || '';
        
        // Secondary complaints
        if (emrSecondaryComplaints) {
            if (doc.secondaryComplaints && doc.secondaryComplaints.length > 0) {
                console.log("Setting secondary complaints:", doc.secondaryComplaints);
                emrSecondaryComplaints.value = doc.secondaryComplaints.join('\n');
            } else {
                emrSecondaryComplaints.value = '';
            }
        }
        
        // History of present illness
        console.log("Setting HPI:", doc.historyOfPresentIllness);
        if (emrHPI) emrHPI.value = doc.historyOfPresentIllness || '';
        
        // Past medical history
        if (doc.pastMedicalHistory) {
            console.log("Setting past medical history:", doc.pastMedicalHistory);
            if (emrConditions) emrConditions.value = doc.pastMedicalHistory.conditions ? doc.pastMedicalHistory.conditions.join('\n') : '';
            if (emrSurgeries) emrSurgeries.value = doc.pastMedicalHistory.surgeries ? doc.pastMedicalHistory.surgeries.join('\n') : '';
            if (emrAllergies) emrAllergies.value = doc.pastMedicalHistory.allergies ? doc.pastMedicalHistory.allergies.join('\n') : '';
        }
        
        // Vital signs
        if (doc.vitalSigns) {
            console.log("Setting vital signs:", doc.vitalSigns);
            if (emrBP) emrBP.value = doc.vitalSigns.bloodPressure || '';
            if (emrHR) emrHR.value = doc.vitalSigns.heartRate || '';
            if (emrRR) emrRR.value = doc.vitalSigns.respiratoryRate || '';
            if (emrTemp) emrTemp.value = doc.vitalSigns.temperature || '';
            if (emrO2) emrO2.value = doc.vitalSigns.oxygenSaturation || '';
            if (emrHeight) emrHeight.value = doc.vitalSigns.height || '';
            if (emrWeight) emrWeight.value = doc.vitalSigns.weight || '';
            if (emrBMI) emrBMI.value = doc.vitalSigns.bmi || '';
        }
        
        // Assessments
        console.log("Setting assessments:", doc.assessments);
        if (emrAssessmentsContainer) {
            populateAssessmentForms(emrAssessmentsContainer, doc.assessments || []);
        }
        
        // Medications
        console.log("Setting medications:", doc.medications);
        if (emrPrescribedMedsContainer) {
            populateMedicationForms(emrPrescribedMedsContainer, doc.medications?.prescribed || []);
        }
        if (emrSuggestedMeds) {
            populateSelectableList(emrSuggestedMeds, doc.medications?.suggested || [], 'medication');
        }
        
        // Treatments
        console.log("Setting treatments:", doc.treatmentPlan);
        if (emrPrescribedTreatmentsContainer) {
            populateTreatmentForms(emrPrescribedTreatmentsContainer, doc.treatmentPlan?.prescribed || []);
        }
        if (emrSuggestedTreatments) {
            populateSelectableList(emrSuggestedTreatments, doc.treatmentPlan?.suggested || [], 'treatment');
        }
        
        // Procedures
        console.log("Setting procedures:", doc.procedures);
        if (emrPerformedProceduresContainer) {
            populateProcedureForms(emrPerformedProceduresContainer, doc.procedures?.performed || []);
        }
        if (emrSuggestedProcedures) {
            populateSelectableList(emrSuggestedProcedures, doc.procedures?.suggested || [], 'procedure');
        }
        
        // Follow-up
        if (doc.followUp) {
            console.log("Setting follow-up:", doc.followUp);
            if (emrFollowUpTiming) emrFollowUpTiming.value = doc.followUp.timing || '';
            if (emrFollowUpInstructions) emrFollowUpInstructions.value = doc.followUp.instructions || '';
            
            // Referrals
            if (emrReferralsContainer) {
                populateReferralForms(emrReferralsContainer, doc.followUp.referrals || []);
            }
        }
        
        console.log("EMR interface population complete");
    } catch (error) {
        console.error("Error populating EMR interface:", error);
        alert("Error populating EMR interface: " + error.message);
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

/**
 * Populate selectable lists (for suggested items with checkboxes)
 */
function populateSelectableList(container, items, type) {
    // Clear existing content
    if (!container) {
        console.error(`Container for ${type} is not found in the DOM`);
        return;
    }
    
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = '<div class="selectable-item">No suggestions available</div>';
        return;
    }
    
    // Add a selectable item for each suggestion
    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'selectable-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${type}-${index}`;
        checkbox.dataset.type = type;
        checkbox.dataset.index = index;
        
        // Add change event listener to track selected items
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                selectedItems[`${type}s`].push(item);
            } else {
                selectedItems[`${type}s`] = selectedItems[`${type}s`].filter((_, i) => i !== parseInt(this.dataset.index));
            }
        });
        
        const details = document.createElement('div');
        details.className = 'item-details';
        
        if (type === 'medication') {
            const name = document.createElement('div');
            name.className = 'item-name';
            name.textContent = item.name;
            
            const info = document.createElement('div');
            info.className = 'item-info';
            info.textContent = `${item.dosage || ''} ${item.frequency || ''} ${item.duration ? 'for ' + item.duration : ''}`;
            
            details.appendChild(name);
            details.appendChild(info);
            
            if (item.rationale) {
                const rationale = document.createElement('div');
                rationale.className = 'item-rationale';
                rationale.textContent = `Rationale: ${item.rationale}`;
                details.appendChild(rationale);
            }
        } else if (type === 'procedure') {
            const name = document.createElement('div');
            name.className = 'item-name';
            name.textContent = item.name;
            
            const info = document.createElement('div');
            info.className = 'item-info';
            if (item.cptCode) {
                info.textContent = `CPT: ${item.cptCode}`;
            }
            
            details.appendChild(name);
            details.appendChild(info);
            
            if (item.medicalNecessity || item.rationale) {
                const rationale = document.createElement('div');
                rationale.className = 'item-rationale';
                rationale.textContent = `Rationale: ${item.medicalNecessity || item.rationale}`;
                details.appendChild(rationale);
            }
        } else if (type === 'treatment') {
            const name = document.createElement('div');
            name.className = 'item-name';
            name.textContent = item.treatment;
            
            const info = document.createElement('div');
            info.className = 'item-info';
            if (item.duration) {
                info.textContent = `Duration: ${item.duration}`;
            }
            
            details.appendChild(name);
            details.appendChild(info);
            
            if (item.rationale) {
                const rationale = document.createElement('div');
                rationale.className = 'item-rationale';
                rationale.textContent = `Rationale: ${item.rationale}`;
                details.appendChild(rationale);
            }
        }
        
        div.appendChild(checkbox);
        div.appendChild(details);
        container.appendChild(div);
    });
}

// Export functions to global scope
window.removeFormItem = removeFormItem;
window.addEmrFormItem = addEmrFormItem;
window.saveDocumentation = saveDocumentation;
window.populateEMRInterface = populateEMRInterface; 