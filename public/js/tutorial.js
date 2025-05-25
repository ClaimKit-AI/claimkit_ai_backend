/**
 * Tutorial functionality for ClaimKit Voice Companion
 * Handles the interactive walkthrough with animations
 */

document.addEventListener('DOMContentLoaded', () => {
    initTutorial();
});

/**
 * Initialize the tutorial functionality
 */
function initTutorial() {
    // Tutorial elements
    const tutorialOverlay = document.getElementById('tutorialOverlay');
    const skipTutorialBtn = document.getElementById('skipTutorial');
    const showTutorialBtn = document.getElementById('showTutorial');
    const prevTutorialBtn = document.getElementById('prevTutorial');
    const nextTutorialBtn = document.getElementById('nextTutorial');
    const tutorialSteps = document.querySelectorAll('.tutorial-step');
    const tutorialDots = document.querySelectorAll('.tutorial-dot');
    
    // Current tutorial step
    let currentTutorialStep = 1;
    const totalTutorialSteps = tutorialSteps.length;
    
    // Check if this is the first visit (show tutorial automatically)
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
        // Show tutorial automatically after a short delay
        setTimeout(() => {
            showTutorial();
            // Set flag in localStorage so we don't show it automatically next time
            localStorage.setItem('hasSeenTutorial', 'true');
        }, 1000);
    }
    
    // Add event listeners
    if (skipTutorialBtn) {
        skipTutorialBtn.addEventListener('click', hideTutorial);
    }
    
    if (showTutorialBtn) {
        showTutorialBtn.addEventListener('click', showTutorial);
    }
    
    if (prevTutorialBtn) {
        prevTutorialBtn.addEventListener('click', () => {
            goToTutorialStep(currentTutorialStep - 1);
        });
    }
    
    if (nextTutorialBtn) {
        nextTutorialBtn.addEventListener('click', () => {
            if (currentTutorialStep < totalTutorialSteps) {
                goToTutorialStep(currentTutorialStep + 1);
            } else {
                // If we're at the last step, close the tutorial
                hideTutorial();
            }
        });
    }
    
    // Add click handlers for tutorial dots
    tutorialDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const stepNumber = parseInt(dot.getAttribute('data-step'));
            goToTutorialStep(stepNumber);
        });
    });
    
    // Also add keyboard navigation
    document.addEventListener('keydown', event => {
        // Only handle keys if tutorial is visible
        if (tutorialOverlay && tutorialOverlay.classList.contains('active')) {
            if (event.key === 'Escape') {
                hideTutorial();
            } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                if (currentTutorialStep < totalTutorialSteps) {
                    goToTutorialStep(currentTutorialStep + 1);
                }
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                if (currentTutorialStep > 1) {
                    goToTutorialStep(currentTutorialStep - 1);
                }
            }
        }
    });
    
    /**
     * Show the tutorial overlay
     */
    function showTutorial() {
        if (tutorialOverlay) {
            tutorialOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            goToTutorialStep(1); // Reset to first step
        }
    }
    
    /**
     * Hide the tutorial overlay
     */
    function hideTutorial() {
        if (tutorialOverlay) {
            tutorialOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        }
    }
    
    /**
     * Navigate to a specific tutorial step
     * @param {Number} step - Step number to navigate to
     */
    function goToTutorialStep(step) {
        if (step < 1 || step > totalTutorialSteps) {
            console.error('Invalid tutorial step');
            return;
        }
        
        // Update current step
        currentTutorialStep = step;
        
        // Update step visibility
        tutorialSteps.forEach(stepEl => {
            stepEl.classList.remove('active');
            
            const stepNumber = parseInt(stepEl.getAttribute('data-step'));
            if (stepNumber === currentTutorialStep) {
                stepEl.classList.add('active');
            }
        });
        
        // Update dots
        tutorialDots.forEach(dot => {
            dot.classList.remove('active');
            
            const dotStep = parseInt(dot.getAttribute('data-step'));
            if (dotStep === currentTutorialStep) {
                dot.classList.add('active');
            }
        });
        
        // Update navigation buttons
        if (prevTutorialBtn) {
            prevTutorialBtn.disabled = currentTutorialStep === 1;
        }
        
        if (nextTutorialBtn) {
            if (currentTutorialStep === totalTutorialSteps) {
                nextTutorialBtn.textContent = 'Finish';
                nextTutorialBtn.innerHTML = 'Finish <i class="fas fa-check"></i>';
            } else {
                nextTutorialBtn.textContent = 'Next';
                nextTutorialBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
            }
        }
    }
} 