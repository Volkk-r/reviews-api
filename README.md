# Reviews API

Учебный backend независимого модуля отзывов квартир. Он включает собственную регистрацию, вход и JWT-авторизацию; существующий backend бронирования не требуется. Данные хранятся в `data/db.json`, поэтому проект можно запустить локально без установки и настройки СУБД.

## Требования

- Node.js 20 или новее
- npm

## Запуск

```bash
npm install
cp .env.example .env
npm run dev
```

API будет доступен по адресу `http://localhost:4000`, Swagger UI — по адресу `http://localhost:4000/api-docs`, а спецификация OpenAPI JSON — по `/api-docs.json`. В Swagger UI можно выполнить запросы прямо из браузера: для защищённых маршрутов сначала войдите через `POST /auth/login`, затем нажмите **Authorize** и вставьте JWT. При первом запуске сервер автоматически создаёт базу и добавляет демонстрационные записи. Команду `npm run seed` можно использовать отдельно; она не перезаписывает существующую базу.

Для обычного запуска после сидирования:

```bash
npm run dev
```

Для сборки:

```bash
npm run build
npm run start:prod
```

`JWT_SECRET` в `.env` замените на длинную случайную строку. `CORS_ORIGIN` должен совпадать с адресом фронтенда. По умолчанию это `http://localhost:5173`.

## Тестовые данные

После `npm run seed` доступны 3 квартиры, 6 пользователей, 18 отзывов у квартиры `1`, 3 отзыва у квартиры `2` и пустой список у квартиры `3`.

| Аккаунт | Email | Пароль | Доступный сценарий |
| --- | --- | --- | --- |
| Студент | `student@example.com` | `student123` | Уже оставил отзыв на квартире 1; может создать отзыв на квартире 3 |
| Анна | `anna@example.com` | `anna1234` | Уже оставила отзыв на квартирах 1 и 2 |
| Иван | `ivan@example.com` | `ivan1234` | Уже оставил отзыв на квартирах 1 и 2 |

Остальные аккаунты: `maria@example.com`, `dmitry@example.com`, `elena@example.com`; пароль каждого совпадает с частью email до `@` и заканчивается на `1234` (например, `maria1234`). Пользовательские пароли нужны только для учебных запросов.

## Авторизация

### Регистрация

`POST /auth/register`

```json
{ "name": "Имя Фамилия", "email": "user@example.com", "password": "password123" }
```

Ответ `201`: `{ "user": { "id": 7, "name": "Имя Фамилия", "email": "user@example.com", "avatarUrl": null }, "token": "..." }`.

### Вход

`POST /auth/login`

```json
{ "email": "student@example.com", "password": "student123" }
```

Полученный токен передаётся в изменяющих запросах заголовком:

```http
Authorization: Bearer <token>
```

`GET /auth/me` возвращает публичные данные текущего пользователя.

## Отзывы

### Собственный отзыв

`GET /apartments/:apartmentId/reviews/me` — требует JWT. Возвращает `{ "review": <Review> }`, если пользователь уже оставил отзыв, или `{ "review": null }`, если ещё нет. Несуществующая квартира возвращает `404`.

### Список и пагинация

`GET /apartments/:apartmentId/reviews?sortBy=createdAt&order=desc&page=1&limit=5`

`sortBy`: `createdAt` или `rating`; `order`: `asc` или `desc`; `page` от 1; `limit` от 1 до 50. Значения по умолчанию: `createdAt`, `desc`, `1`, `5`. При равных значениях применяется стабильный порядок по `id`.

```json
{
  "items": [{
    "id": 1,
    "apartmentId": 1,
    "userId": 6,
    "rating": 5,
    "title": "Отличный отдых",
    "comment": "Очень чисто и уютно, заселение прошло без проблем.",
    "createdAt": "2026-09-07T12:00:00.000Z",
    "updatedAt": "2026-09-07T12:00:00.000Z",
    "author": { "id": 6, "name": "Тестовый пользователь", "avatarUrl": null }
  }],
  "total": 18,
  "page": 1,
  "limit": 5,
  "totalPages": 4
}
```

### Сводка

`GET /apartments/:apartmentId/reviews/summary`

```json
{ "apartmentId": 1, "averageRating": 4.4, "reviewsCount": 18 }
```

Если отзывов нет, `averageRating` равен `null`, а `reviewsCount` — `0`.

### Создание

`POST /apartments/:apartmentId/reviews` — требуется токен.

```json
{ "rating": 5, "title": "Прекрасное место", "comment": "Квартира соответствует фотографиям, всё понравилось." }
```

Поля обязательны. `rating` — целое число 1–5, `title` — 3–100 символов, `comment` — 10–2000 символов. На одну квартиру разрешён один отзыв пользователя. Сервер выставляет автора и даты.

### Редактирование

`PATCH /reviews/:reviewId` — только автор может менять отзыв. Тело содержит одно или несколько полей `rating`, `title`, `comment` с теми же правилами валидации. `updatedAt` обновляется сервером.

### Удаление

`DELETE /reviews/:reviewId` — только автор; успешный ответ `204 No Content`.

### Дополнительные запросы квартир

`GET /apartments` и `GET /apartments/:apartmentId` включают вычисленные `averageRating` и `reviewsCount`. Это демонстрационные endpoints для карточек квартир; в модуле можно использовать любой из них.

## Формат ошибок

Ошибки имеют единый вид:

```json
{ "statusCode": 400, "message": "Проверьте введённые данные", "error": "Bad Request", "fields": { "rating": "Оценка должна быть целым числом от 1 до 5" } }
```

Основные статусы: `400` — некорректные данные/query, `401` — авторизация, `403` — чужой отзыв, `404` — квартира/отзыв/маршрут не найдены, `409` — повторный отзыв, `500` — внутренняя ошибка.

## Примеры curl

```bash
# Войти и сохранить токен в shell-переменную TOKEN
TOKEN=$(curl -s http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"student@example.com","password":"student123"}' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).token))')

# Посмотреть пустую квартиру и её сводку
curl 'http://localhost:4000/apartments/3/reviews?page=1&limit=5'
curl 'http://localhost:4000/apartments/3/reviews/summary'

# Создать отзыв на квартире 3
curl -X POST 'http://localhost:4000/apartments/3/reviews' \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"rating":5,"title":"Тестовый отзыв","comment":"Всё понравилось, обязательно вернусь."}'
```

## Важные ограничения учебного хранилища

JSON-файл рассчитан на локальную работу одного студента и не предназначен для production или одновременной работы нескольких процессов. Все данные сохраняются в `data/db.json`; чтобы сбросить базу, остановите сервер, удалите этот файл и снова выполните `npm run seed`.
