const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', false);

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.warn('⚠️ OPOZORILO: MONGO_URI ni nastavljen v .env ali okoljskih spremenljivkah!');
    return;
  }
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
};

module.exports = connectDB;
