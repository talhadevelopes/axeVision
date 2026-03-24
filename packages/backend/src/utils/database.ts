import mongoose from 'mongoose';

export const connectDatabase = async (retries = 10) => {
  while (retries > 0) {
    try {
      const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/axeVision';
      await mongoose.connect(mongoUri);
      console.log("Connected to MongoDB via Mongoose");
      return;
    } catch (error: any) {
      console.error("Database connection error:", error.message);
      retries--;
      if (retries === 0) {
        console.error("Failed to connect after retries");
        process.exit(1);
      }
      //wait 2 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};