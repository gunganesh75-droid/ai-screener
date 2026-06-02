import mongoose from 'mongoose';
import dns from 'dns';

const connectDB = async () => {
  try {
    // Set fallback public DNS servers to guarantee resolution of MongoDB Atlas SRV records
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (dnsErr) {
      console.warn('DNS server configuration warning:', dnsErr.message);
    }
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resume-screener');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
