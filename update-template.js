// Update template script to force update the template in the database
require('dotenv').config();
const mongoose = require('mongoose');
const doctorNotesReviewTemplate = require('./src/templates/doctorNotesReview');
const doctorNotesEnhancementTemplate = require('./src/templates/doctorNotesEnhancement');

async function updateTemplate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Import the Template model
    const Template = require('./src/models/Template');
    
    // Update doctor notes review template
    console.log('Updating doctor notes review template...');
    await Template.deleteOne({ name: doctorNotesReviewTemplate.name });
    const reviewTemplate = await Template.create(doctorNotesReviewTemplate);
    console.log('Template updated successfully:', reviewTemplate.name);
    
    // Update doctor notes enhancement template
    console.log('Updating doctor notes enhancement template...');
    await Template.deleteOne({ name: doctorNotesEnhancementTemplate.name });
    const enhancementTemplate = await Template.create(doctorNotesEnhancementTemplate);
    console.log('Template updated successfully:', enhancementTemplate.name);
    
    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating templates:', error);
    process.exit(1);
  }
}

updateTemplate(); 