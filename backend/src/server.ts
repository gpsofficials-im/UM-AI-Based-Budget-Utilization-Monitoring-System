import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { User } from './models/User';
import { seedInitialData } from './seed/seedData';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Automatically check and seed realistic demonstration data if database is fresh
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Bootstrap] No existing users detected. Seeding realistic sample government datasets...');
      await seedInitialData();
    }

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Budget Monitoring API running on http://localhost:${PORT}`);
      console.log(`🌐 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
