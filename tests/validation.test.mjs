import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReviewInput, parsePositiveInteger } from '../dist/validation.js';

test('validates required review fields and trims text', () => {
  assert.deepEqual(validateReviewInput({ rating: 5, title: '  Уютно  ', comment: '  Всё было отлично.  ' }), {
    rating: 5, title: 'Уютно', comment: 'Всё было отлично.',
  });
});

test('accepts only supplied valid fields for PATCH', () => {
  assert.deepEqual(validateReviewInput({ rating: 4 }, true), { rating: 4 });
});

test('rejects invalid rating and attempts to change protected fields', () => {
  assert.throws(() => validateReviewInput({ rating: 6, title: 'Хорошо', comment: 'Нормальное описание', userId: 7 }), (error) => {
    assert.equal(error.statusCode, 400);
    assert.equal(error.fields.rating, 'Оценка должна быть целым числом от 1 до 5');
    assert.equal(error.fields.userId, 'Это поле нельзя передавать');
    return true;
  });
});

test('rejects empty PATCH and invalid query integers', () => {
  assert.throws(() => validateReviewInput({}, true), (error) => error.statusCode === 400 && Boolean(error.fields.body));
  assert.throws(() => parsePositiveInteger('0', 'page'), (error) => error.statusCode === 400);
});
