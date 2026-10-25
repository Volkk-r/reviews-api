import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { corsOrigin } from './config.js';
import { ApiError } from './errors.js';
import { openApiDocument } from './openapi.js';
import { apartmentsRouter } from './routes/apartments.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { reviewsRouter } from './routes/reviews.routes.js';

export const app = express();
app.use(cors({ origin: corsOrigin === '*' ? '*' : corsOrigin }));
app.use(express.json({ limit: '32kb' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api-docs.json', (_req, res) => res.json(openApiDocument));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use('/auth', authRouter);
app.use('/apartments', apartmentsRouter);
app.use(reviewsRouter);
app.use((_req, _res, next) => next(new ApiError(404, 'Маршрут не найден', 'Not Found')));

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ statusCode: error.statusCode, message: error.message, error: error.error, ...(error.fields ? { fields: error.fields } : {}) });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ statusCode: 400, message: 'Некорректный JSON в теле запроса', error: 'Bad Request' });
    return;
  }
  console.error(error);
  res.status(500).json({ statusCode: 500, message: 'Внутренняя ошибка сервера', error: 'Internal Server Error' });
};
app.use(errorHandler);
