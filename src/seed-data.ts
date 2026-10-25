import { hashPassword } from './auth.js';
import { db, saveDatabase } from './store.js';
import type { Apartment, Review, User } from './types.js';

export async function seedDatabase(): Promise<void> {
const database = db();
if (database.users.length || database.apartments.length || database.reviews.length) {
  console.log('В базе уже есть данные. Сидирование пропущено, чтобы не перезаписать их.');
  return;
}

const now = Date.now();
const isoDaysAgo = (days: number) => new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
const accounts = [
  { name: 'Анна Смирнова', email: 'anna@example.com', password: 'anna1234', avatarUrl: null },
  { name: 'Иван Петров', email: 'ivan@example.com', password: 'ivan1234', avatarUrl: null },
  { name: 'Мария Волкова', email: 'maria@example.com', password: 'maria1234', avatarUrl: null },
  { name: 'Дмитрий Орлов', email: 'dmitry@example.com', password: 'dmitry1234', avatarUrl: null },
  { name: 'Елена Кузнецова', email: 'elena@example.com', password: 'elena1234', avatarUrl: null },
  { name: 'Тестовый пользователь', email: 'student@example.com', password: 'student123', avatarUrl: null },
];
const users: User[] = await Promise.all(accounts.map(async (account, index) => ({
  id: index + 1, name: account.name, email: account.email, passwordHash: await hashPassword(account.password),
  avatarUrl: account.avatarUrl, createdAt: isoDaysAgo(90 - index),
})));
const apartments: Apartment[] = [
  { id: 1, title: 'Светлая квартира у набережной', address: 'Волжская набережная, 12', city: 'Ярославль', imageUrl: null, createdAt: isoDaysAgo(180) },
  { id: 2, title: 'Уютная студия в центре', address: 'ул. Кирова, 8', city: 'Ярославль', imageUrl: null, createdAt: isoDaysAgo(150) },
  { id: 3, title: 'Квартира с видом на парк', address: 'ул. Свободы, 41', city: 'Ярославль', imageUrl: null, createdAt: isoDaysAgo(120) },
];
const reviewTexts = [
  ['Отличный отдых', 'Очень чисто и уютно, заселение прошло без проблем.'],
  ['Хорошее расположение', 'Рядом набережная и кафе, до центра легко добраться.'],
  ['Всё понравилось', 'Квартира полностью соответствует фотографиям.'],
  ['Комфортно', 'Было всё необходимое для нескольких дней проживания.'],
  ['Вернёмся снова', 'Удобная кровать, тихий двор и приятный хозяин.'],
  ['Есть нюансы', 'В целом хорошо, но хотелось бы больше посуды на кухне.'],
  ['Прекрасное место', 'Чистая квартира в красивом районе, рекомендую.'],
  ['Удобно и спокойно', 'Хорошее место для короткой поездки, всё рядом.'],
  ['Хороший вариант', 'Цена соответствует качеству, заселение быстрое.'],
  ['Замечательная квартира', 'Просторно, светло и очень аккуратно.'],
  ['Всё рядом', 'Магазины, остановка и достопримечательности поблизости.'],
  ['Тихое место', 'Отдохнули отлично, ночью было тихо и комфортно.'],
  ['Неплохо', 'Квартира понравилась, небольшие замечания не испортили поездку.'],
  ['Рекомендую', 'Опрятное жильё и понятная инструкция по заселению.'],
  ['Отличная поездка', 'Всё прошло хорошо, хозяин был на связи.'],
  ['Уютно', 'Приятный интерьер и удобное расположение.'],
  ['Хороший отдых', 'Остановились на выходные и остались довольны.'],
  ['Спасибо', 'Чисто, спокойно и удобно для прогулок по городу.'],
] as const;
const reviews: Review[] = reviewTexts.map(([title, comment], index) => ({
  id: index + 1, apartmentId: 1, userId: index === 0 ? 6 : (index % 5) + 1,
  rating: [5, 4, 5, 4, 5, 3, 5, 4, 4, 5, 4, 5, 3, 5, 4, 5, 4, 5][index],
  title, comment, createdAt: isoDaysAgo(45 - index * 2), updatedAt: isoDaysAgo(45 - index * 2),
}));
reviews.push(
  { id: 19, apartmentId: 2, userId: 1, rating: 5, title: 'Студия супер', comment: 'Чисто, удобно и близко к основным местам города.', createdAt: isoDaysAgo(3), updatedAt: isoDaysAgo(3) },
  { id: 20, apartmentId: 2, userId: 2, rating: 4, title: 'Хорошо для выходных', comment: 'Удобное расположение, заселение прошло быстро.', createdAt: isoDaysAgo(11), updatedAt: isoDaysAgo(11) },
  { id: 21, apartmentId: 2, userId: 3, rating: 5, title: 'Советую', comment: 'Небольшая, но очень уютная квартира в центре.', createdAt: isoDaysAgo(18), updatedAt: isoDaysAgo(18) },
);
database.users = users;
database.apartments = apartments;
database.reviews = reviews;
database.nextIds = { user: users.length + 1, apartment: apartments.length + 1, review: reviews.length + 1 };
await saveDatabase();
console.log('Тестовые данные добавлены: 6 пользователей, 3 квартиры, 21 отзыв.');
console.log('Аккаунты: anna@example.com / anna1234, student@example.com / student123');
console.log('Тестовый пользователь student@example.com уже оставил отзыв на квартиру 1; для POST используйте квартиру 3.');
}
