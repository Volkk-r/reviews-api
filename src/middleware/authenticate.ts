import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../auth.js';
import { db } from '../store.js';
import { ApiError } from '../errors.js';
import type { User } from '../types.js';

declare global {
  namespace Express {
    interface Request { user?: User }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authorization = req.header('authorization');
  if (!authorization?.startsWith('Bearer ')) return next(new ApiError(401, 'Требуется авторизация', 'Unauthorized'));
  try {
    const { userId } = verifyToken(authorization.slice(7));
    const user = db().users.find((item) => item.id === userId);
    if (!user) return next(new ApiError(401, 'Пользователь токена не найден', 'Unauthorized'));
    req.user = user;
    next();
  } catch {
    next(new ApiError(401, 'Токен отсутствует, недействителен или просрочен', 'Unauthorized'));
  }
}
