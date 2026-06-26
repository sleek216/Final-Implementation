import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    console.log('Connecting to MongoDB...');

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed!');
    console.error('Error Trace:', error.message);

    if (error.message.includes('ETIMEOUT')) {
      console.error('HINT: This is a DNS/Network timeout. Check your internet connection or if your IP is whitelisted in MongoDB Atlas.');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('HINT: Connection refused. Check if your database server is running.');
    } else if (error.message.includes('Authentication failed')) {
      console.error('HINT: Check your database username and password in .env');
    }

    throw error; // Rethrow to be caught by startServer
  }
};

export default connectDB;
