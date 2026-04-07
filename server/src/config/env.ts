import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env['PORT'] ?? '5000', 10),
  mongodbUri: requireEnv('MONGODB_URI'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] ?? '8h',
  clientUrl: process.env['CLIENT_URL'] ?? 'http://localhost:5173',
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  uploadDir: process.env['UPLOAD_DIR'] ?? './uploads',
} as const;
