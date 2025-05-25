const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authController = require('../controllers/authController');
const upload = require('../middlewares/upload');

// PUBLIC ROUTES - no authentication required
// Make sure these are BEFORE the authentication middleware
router.post('/transcribe', upload.single('file'), aiController.transcribeAudio);
router.post('/test/doctor-notes/review', aiController.reviewDoctorNotes);
router.post('/test/doctor-notes/enhance', aiController.enhanceDoctorNotes);
router.post('/test/clinical-documentation/generate', aiController.generateClinicalDocumentation);

// API key authentication middleware - all routes below require authentication
router.use(authController.authenticateApiKey);

// Protected routes
router.post('/template/:templateId', aiController.processWithTemplate);
router.post('/provider/:provider/service/:serviceType', aiController.processWithProvider);
router.post('/doctor-notes/review', aiController.reviewDoctorNotes);
router.post('/doctor-notes/enhance', aiController.enhanceDoctorNotes);
router.post('/clinical-documentation/generate', aiController.generateClinicalDocumentation);

// Simple test endpoint to verify OpenAI connection
router.get('/openai-test', async (req, res) => {
  try {
    const { OpenAI } = require('openai');
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'OPENAI_API_KEY is not set in environment variables'
      });
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Simple completion to test connection
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello, API test!" }],
      max_tokens: 5
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'OpenAI API connection successful',
      data: completion.choices[0]
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: `OpenAI API connection failed: ${error.message}`,
      error: error.stack
    });
  }
});

module.exports = router; 