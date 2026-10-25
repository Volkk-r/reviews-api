import { Router } from 'express';
import { ApiError, notFound } from '../errors.js';
import { authenticate } from '../middleware/authenticate.js';
import { db, saveDatabase } from '../store.js';
import type { Review, ReviewResponse } from '../types.js';
import { parsePositiveInteger, validateReviewInput } from '../validation.js';

export const reviewsRouter = Router();
const allowedSort = ['createdAt', 'rating'] as const;

function requireApartment(apartmentId: number) {
  const apartment = db().apartments.find((item) => item.id === apartmentId);
  if (!apartment) throw notFound('Квартира не найдена');
  return apartment;
}

function reviewWithAuthor(review: Review): ReviewResponse {
  const user = db().users.find((item) => item.id === review.userId);
  if (!user) throw new Error(`Review ${review.id} refers to missing user ${review.userId}`);
  return {
    ...review,
    author: { id: user.id, name: user.name, avatarUrl: user.avatarUrl },
  };
}

reviewsRouter.get('/apartments/:apartmentId/reviews/me', authenticate, (req, res) => {
  const apartmentId = parsePositiveInteger(req.params.apartmentId, 'apartmentId');
  requireApartment(apartmentId);
  const review = db().reviews.find((item) => item.apartmentId === apartmentId && item.userId === req.user!.id);
  res.json({ review: review ? reviewWithAuthor(review) : null });
});

reviewsRouter.get('/apartments/:apartmentId/reviews/summary', (req, res) => {
  const apartmentId = parsePositiveInteger(req.params.apartmentId, 'apartmentId');
  requireApartment(apartmentId);
  const reviews = db().reviews.filter((review) => review.apartmentId === apartmentId);
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;
  res.json({ apartmentId, averageRating: average === null ? null : Math.round(average * 10) / 10, reviewsCount: reviews.length });
});

reviewsRouter.get('/apartments/:apartmentId/reviews', (req, res) => {
  const apartmentId = parsePositiveInteger(req.params.apartmentId, 'apartmentId');
  requireApartment(apartmentId);
  const sortByValue = req.query.sortBy ?? 'createdAt';
  const orderValue = req.query.order ?? 'desc';
  if (typeof sortByValue !== 'string' || !allowedSort.includes(sortByValue as typeof allowedSort[number])) {
    throw new ApiError(400, 'Некорректный параметр sortBy', 'Bad Request', { sortBy: 'Допустимые значения: createdAt, rating' });
  }
  if (orderValue !== 'asc' && orderValue !== 'desc') {
    throw new ApiError(400, 'Некорректный параметр order', 'Bad Request', { order: 'Допустимые значения: asc, desc' });
  }
  const page = parsePositiveInteger(req.query.page, 'page', 1);
  const limit = parsePositiveInteger(req.query.limit, 'limit', 5);
  if (limit > 50) throw new ApiError(400, 'Параметр limit не должен превышать 50', 'Bad Request', { limit: 'Допустимый диапазон: 1–50' });

  const direction = orderValue === 'asc' ? 1 : -1;
  const allItems = db().reviews.filter((review) => review.apartmentId === apartmentId).sort((a, b) => {
    const primary = sortByValue === 'rating'
      ? a.rating - b.rating
      : Date.parse(a.createdAt) - Date.parse(b.createdAt);
    // При совпадении поля сохраняем предсказуемый порядок по id.
    return primary === 0 ? a.id - b.id : primary * direction;
  });
  const total = allItems.length;
  const totalPages = Math.ceil(total / limit);
  const items = allItems.slice((page - 1) * limit, page * limit).map(reviewWithAuthor);
  res.json({ items, total, page, limit, totalPages });
});

reviewsRouter.post('/apartments/:apartmentId/reviews', authenticate, async (req, res) => {
  const apartmentId = parsePositiveInteger(req.params.apartmentId, 'apartmentId');
  requireApartment(apartmentId);
  const database = db();
  if (database.reviews.some((review) => review.apartmentId === apartmentId && review.userId === req.user!.id)) {
    throw new ApiError(409, 'Вы уже оставили отзыв на эту квартиру', 'Conflict');
  }
  const input = validateReviewInput(req.body);
  const now = new Date().toISOString();
  const review: Review = {
    id: database.nextIds.review++, apartmentId, userId: req.user!.id,
    rating: input.rating as number, title: input.title as string, comment: input.comment as string,
    createdAt: now, updatedAt: now,
  };
  database.reviews.push(review);
  await saveDatabase();
  res.status(201).json(reviewWithAuthor(review));
});

reviewsRouter.patch('/reviews/:reviewId', authenticate, async (req, res) => {
  const reviewId = parsePositiveInteger(req.params.reviewId, 'reviewId');
  const review = db().reviews.find((item) => item.id === reviewId);
  if (!review) throw notFound('Отзыв не найден');
  if (review.userId !== req.user!.id) throw new ApiError(403, 'Вы можете редактировать только собственные отзывы', 'Forbidden');
  const input = validateReviewInput(req.body, true);
  Object.assign(review, input, { updatedAt: new Date().toISOString() });
  await saveDatabase();
  res.json(reviewWithAuthor(review));
});

reviewsRouter.delete('/reviews/:reviewId', authenticate, async (req, res) => {
  const reviewId = parsePositiveInteger(req.params.reviewId, 'reviewId');
  const database = db();
  const index = database.reviews.findIndex((item) => item.id === reviewId);
  if (index === -1) throw notFound('Отзыв не найден');
  if (database.reviews[index].userId !== req.user!.id) throw new ApiError(403, 'Вы можете удалять только собственные отзывы', 'Forbidden');
  database.reviews.splice(index, 1);
  await saveDatabase();
  res.status(204).end();
});
