import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { db } from './config/firebase.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('Verifying Firebase configuration...');
    
    // Test connection gracefully
    try {
      await db.listCollections();
      console.log('✅ Firebase Firestore Connected Successfully!');
    } catch (dbErr) {
      console.warn('\n⚠️ Firebase Database Warning:', dbErr.message);
      console.warn('👉 To connect to Firestore locally, make sure to either:');
      console.warn('   1. Run `gcloud auth application-default login` in your terminal.');
      console.warn('   2. Download a service account JSON file and set FIREBASE_SERVICE_ACCOUNT in your .env');
      console.warn('   The server will run, but DB requests will fail until configured.\n');
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`📡 API Base: http://localhost:${PORT}/api`);
      console.log(`🏥 Health:   http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
