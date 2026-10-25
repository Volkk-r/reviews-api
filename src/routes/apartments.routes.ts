import { Router } from 'express';
import { notFound } from '../errors.js';
import { db } from '../store.js';
import { parsePositiveInteger } from '../validation.js';

export const apartmentsRouter = Router();

function apartmentWithSummary(apartment: ReturnType<typeof db>['apartments'][number]) {
  const reviews = db().reviews.filter((review) => review.apartmentId === apartment.id);
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;
  return { ...apartment, averageRating: average === null ? null : Math.round(average * 10) / 10, reviewsCount: reviews.length };
}

apartmentsRouter.get('/', (_req, res) => res.json({ items: db().apartments.map(apartmentWithSummary) }));
apartmentsRouter.get('/:apartmentId', (req, res) => {
  const id = parsePositiveInteger(req.params.apartmentId, 'apartmentId');
  const apartment = db().apartments.find((item) => item.id === id);
  if (!apartment) throw notFound('Квартира не найдена');
  res.json(apartmentWithSummary(apartment));
});
