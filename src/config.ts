import 'dotenv/config';
import path from 'node:path';

export const port = Number(process.env.PORT ?? 4000);
export const jwtSecret = process.env.JWT_SECRET ?? 'development-only-change-me';
export const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
export const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
export const dataFile = path.resolve(process.cwd(), process.env.DATA_FILE ?? './data/db.json');
