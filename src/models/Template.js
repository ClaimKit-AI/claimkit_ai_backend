const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Template description is required'],
    trim: true
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: ['doctor_notes_review', 'doctor_notes_enhancement', 'claims_generation', 'denials_management'],
    trim: true
  },
  provider: {
    type: String,
    required: [true, 'AI provider is required'],
    enum: ['openai', 'gemini', 'deepseek'],
    default: 'openai',
    trim: true
  },
  model: {
    type: String,
    required: [true, 'AI model is required'],
    trim: true
  },
  prompt: {
    type: String,
    required: [true, 'Template prompt is required']
  },
  inputSchema: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Input schema is required']
  },
  outputSchema: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Output schema is required']
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Template = mongoose.model('Template', templateSchema);

module.exports = Template; 