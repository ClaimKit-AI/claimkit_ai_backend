const Template = require('../models/Template');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// Get all templates
exports.getAllTemplates = async (req, res, next) => {
  try {
    const templates = await Template.find({ isActive: true });
    res.status(200).json({
      status: 'success',
      results: templates.length,
      data: {
        templates
      }
    });
  } catch (error) {
    next(new AppError(`Error fetching templates: ${error.message}`, 500));
  }
};

// Get template by ID
exports.getTemplateById = async (req, res, next) => {
  try {
    const template = await Template.findById(req.params.id);
    
    if (!template) {
      return next(new AppError('Template not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        template
      }
    });
  } catch (error) {
    next(new AppError(`Error fetching template: ${error.message}`, 500));
  }
};

// Create new template
exports.createTemplate = async (req, res, next) => {
  try {
    const newTemplate = await Template.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        template: newTemplate
      }
    });
  } catch (error) {
    next(new AppError(`Error creating template: ${error.message}`, 400));
  }
};

// Update template
exports.updateTemplate = async (req, res, next) => {
  try {
    const updatedTemplate = await Template.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!updatedTemplate) {
      return next(new AppError('Template not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        template: updatedTemplate
      }
    });
  } catch (error) {
    next(new AppError(`Error updating template: ${error.message}`, 400));
  }
};

// Delete template (soft delete by setting isActive to false)
exports.deleteTemplate = async (req, res, next) => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!template) {
      return next(new AppError('Template not found', 404));
    }
    
    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(new AppError(`Error deleting template: ${error.message}`, 500));
  }
};

// Get templates by service type
exports.getTemplatesByServiceType = async (req, res, next) => {
  try {
    const { serviceType } = req.params;
    
    const templates = await Template.find({ 
      serviceType, 
      isActive: true 
    });
    
    res.status(200).json({
      status: 'success',
      results: templates.length,
      data: {
        templates
      }
    });
  } catch (error) {
    next(new AppError(`Error fetching templates: ${error.message}`, 500));
  }
}; 