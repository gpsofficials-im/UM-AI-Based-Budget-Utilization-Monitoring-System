import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_budget_monitoring';

  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${primaryUri}`);
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log('[Database] MongoDB connected successfully to primary database.');
  } catch (primaryErr) {
    console.warn('[Database] Primary MongoDB connection failed or not running locally.');
    console.log('[Database] Launching embedded In-Memory MongoDB engine for seamless testing...');
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] Connected successfully to In-Memory MongoDB at: ${memoryUri}`);
    } catch (memErr) {
      console.error('[Database] Failed to connect to In-Memory MongoDB:', memErr);
      throw memErr;
    }
  }
};

export const closeDB = async (): Promise<void> => {
  await mongoose.connection.close();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
