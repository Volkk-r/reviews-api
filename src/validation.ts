import { badRequest } from './errors.js';

const allowedReviewFields = ['rating', 'title', 'comment'] as const;
type ReviewField = typeof allowedReviewFields[number];

export function validateReviewInput(input: unknown, partial = false): Partial<Record<ReviewField, string | number>> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw badRequest('Тело запроса должно быть JSON-объектом');
  const body = input as Record<string, unknown>;
  const fields: Record<string, string> = {};
  for (const key of Object.keys(body)) {
    if (!allowedReviewFields.includes(key as ReviewField)) fields[key] = 'Это поле нельзя передавать';
  }
  const output: Partial<Record<ReviewField, string | number>> = {};

  if (!partial || 'rating' in body) {
    if (!Number.isInteger(body.rating) || (body.rating as number) < 1 || (body.rating as number) > 5) fields.rating = 'Оценка должна быть целым числом от 1 до 5';
    else output.rating = body.rating as number;
  }
  if (!partial || 'title' in body) {
    if (typeof body.title !== 'string' || body.title.trim().length < 3 || body.title.trim().length > 100) fields.title = 'Заголовок должен содержать от 3 до 100 символов';
    else output.title = body.title.trim();
  }
  if (!partial || 'comment' in body) {
    if (typeof body.comment !== 'string' || body.comment.trim().length < 10 || body.comment.trim().length > 2000) fields.comment = 'Комментарий должен содержать от 10 до 2000 символов';
    else output.comment = body.comment.trim();
  }
  if (partial && Object.keys(body).length === 0) fields.body = 'Передайте хотя бы одно поле для изменения';
  if (Object.keys(fields).length) throw badRequest('Проверьте введённые данные', fields);
  return output;
}

export function parsePositiveInteger(value: unknown, name: string, fallback?: number): number {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value) || Number(value) < 1) throw badRequest(`Параметр ${name} должен быть целым числом больше 0`, { [name]: 'Недопустимое значение' });
  return Number(value);
}
