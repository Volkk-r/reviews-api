import { Router } from 'express';
import { comparePassword, createToken, hashPassword } from '../auth.js';
import { ApiError, badRequest } from '../errors.js';
import { authenticate } from '../middleware/authenticate.js';
import { db, saveDatabase } from '../store.js';

export const authRouter = Router();
const publicUser = (user: ReturnType<typeof db>['users'][number]) => ({ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl });

function validateCredentials(body: unknown, registration: boolean): { name?: string; email: string; password: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw badRequest('Тело запроса должно быть JSON-объектом');
  const data = body as Record<string, unknown>;
  const fields: Record<string, string> = {};
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const password = typeof data.password === 'string' ? data.password : '';
  if (!/^\S+@\S+\.\S+$/.test(email)) fields.email = 'Укажите корректный email';
  if (password.length < 8 || password.length > 100) fields.password = 'Пароль должен содержать от 8 до 100 символов';
  let name: string | undefined;
  if (registration) {
    name = typeof data.name === 'string' ? data.name.trim() : '';
    if (name.length < 2 || name.length > 60) fields.name = 'Имя должно содержать от 2 до 60 символов';
  }
  if (Object.keys(fields).length) throw badRequest('Проверьте введённые данные', fields);
  return { name, email, password };
}

authRouter.post('/register', async (req, res) => {
  const { name, email, password } = validateCredentials(req.body, true);
  const database = db();
  if (database.users.some((user) => user.email === email)) throw new ApiError(409, 'Пользователь с таким email уже зарегистрирован', 'Conflict');
  const user = {
    id: database.nextIds.user++, name: name!, email, passwordHash: await hashPassword(password), avatarUrl: null, createdAt: new Date().toISOString(),
  };
  database.users.push(user);
  await saveDatabase();
  res.status(201).json({ user: publicUser(user), token: createToken(user) });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = validateCredentials(req.body, false);
  const user = db().users.find((item) => item.email === email);
  if (!user || !(await comparePassword(password, user.passwordHash))) throw new ApiError(401, 'Неверный email или пароль', 'Unauthorized');
  res.json({ user: publicUser(user), token: createToken(user) });
});

authRouter.get('/me', authenticate, (req, res) => res.json({ user: publicUser(req.user!) }));
