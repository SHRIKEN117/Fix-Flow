import 'dotenv/config';
import { app } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { startSLACronJob } from './jobs/slaCron';
import { verifySmtp } from './utils/email';

async function bootstrap(): Promise<void> {
  await connectDB();
  await verifySmtp();
  startSLACronJob();

  app.listen(env.port, () => {
    console.log(`🚀 FixFlow server running on port ${env.port} [${env.nodeEnv}]`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
