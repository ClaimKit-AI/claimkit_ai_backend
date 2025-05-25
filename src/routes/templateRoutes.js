const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authController = require('../controllers/authController');

// Protect all routes
router.use(authController.protect);

// Template routes
router.route('/')
  .get(templateController.getAllTemplates)
  .post(authController.restrictTo('admin'), templateController.createTemplate);

// Get templates by service type (put this before /:id route to avoid conflicts)
router.get('/service/:serviceType', templateController.getTemplatesByServiceType);

router.route('/:id')
  .get(templateController.getTemplateById)
  .patch(authController.restrictTo('admin'), templateController.updateTemplate)
  .delete(authController.restrictTo('admin'), templateController.deleteTemplate);

// Dummy implementations since we're not using MongoDB
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Template list endpoint (dummy implementation - database not in use)',
    data: {
      templates: [
        {
          id: 'template-1',
          name: 'Doctor Notes Review',
          type: 'doctor-notes',
          content: 'Sample template content for doctor notes review'
        },
        {
          id: 'template-2',
          name: 'Patient Template',
          type: 'patient',
          content: 'Sample template for patient information'
        }
      ]
    }
  });
});

router.get('/:id', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Get template endpoint (dummy implementation - database not in use)',
    data: {
      template: {
        id: req.params.id,
        name: 'Sample Template',
        type: 'doctor-notes',
        content: 'Sample template content'
      }
    }
  });
});

module.exports = router; 