import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtExpiresIn, jwtSecret } from './config.js';
import type { User } from './types.js';

export interface JwtPayload { userId: number }

export function createToken(user: User): string {
  return jwt.sign({ userId: user.id } satisfies JwtPayload, jwtSecret, { expiresIn: jwtExpiresIn as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): JwtPayload {
  const payload = jwt.verify(token, jwtSecret);
  if (typeof payload === 'string' || typeof payload.userId !== 'number') throw new Error('Invalid token payload');
  return { userId: payload.userId };
}

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash);
