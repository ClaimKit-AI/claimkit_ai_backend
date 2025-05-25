const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB using URI:', process.env.MONGODB_URI);
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // List collections in the database
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(collection => {
      console.log(` - ${collection.name}`);
    });
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

connectDB(); 