const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', false);

const connectDB = async () => {
  //const mongoURI = 'mongodb://admin:JagodaSecretPassword999@localhost:27017/test_data?authSource=admin';
const mongoURI = process.env.MONGO_URI || 'mongodb://admin:skavtisozakon@mongodb:27017/skladisce?authSource=admin';
try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
