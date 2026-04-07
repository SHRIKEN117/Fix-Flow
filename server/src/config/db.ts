import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const uri = process.env['MONGODB_URI'];

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'fixflow',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ MongoDB connection error: ${error.message}`);

      if (error.message.includes('ECONNREFUSED')) {
        console.error('💡 Check that your IP is whitelisted in Atlas Network Access');
      }
      if (error.message.includes('Authentication failed')) {
        console.error('💡 Check your username and password in MONGODB_URI');
      }
      if (error.message.includes('querySrv')) {
        console.error('💡 Check your cluster hostname in MONGODB_URI');
      }
    }
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed (app termination)');
  process.exit(0);
});

export { connectDB };
