export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Reviews API',
    version: '1.0.0',
    description: 'REST API учебного модуля отзывов квартир. Для защищённых запросов нажмите Authorize и укажите JWT-токен.',
  },
  servers: [{ url: 'http://localhost:4000', description: 'Локальный сервер' }],
  tags: [
    { name: 'Auth', description: 'Регистрация, вход и текущий пользователь' },
    { name: 'Apartments', description: 'Демонстрационные данные квартир' },
    { name: 'Reviews', description: 'Отзывы, оценки, сортировка и пагинация' },
    { name: 'Health', description: 'Проверка доступности сервера' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'], summary: 'Проверить доступность API',
        responses: { '200': { description: 'Сервер работает', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } } } } } },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Зарегистрировать пользователя',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string', minLength: 2, maxLength: 60, example: 'Анна Смирнова' }, email: { type: 'string', format: 'email', example: 'anna@example.com' }, password: { type: 'string', format: 'password', minLength: 8, maxLength: 100, example: 'password123' } } } } } },
        responses: { '201': { description: 'Пользователь создан', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } }, '400': { $ref: '#/components/responses/BadRequest' }, '409': { description: 'Email уже зарегистрирован', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Войти и получить JWT',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email', example: 'student@example.com' }, password: { type: 'string', format: 'password', example: 'student123' } } } } } },
        responses: { '200': { description: 'Успешный вход', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } }, '400': { $ref: '#/components/responses/BadRequest' }, '401': { $ref: '#/components/responses/Unauthorized' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'], summary: 'Получить текущего пользователя', security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Текущий пользователь', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } }, '401': { $ref: '#/components/responses/Unauthorized' } },
      },
    },
    '/apartments': {
      get: {
        tags: ['Apartments'], summary: 'Получить список квартир',
        responses: {
          '200': {
            description: 'Список квартир с рассчитанными оценками',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Apartment' } } },
                },
              },
            },
          },
        },
      },
    },
    '/apartments/{apartmentId}': {
      get: {
        tags: ['Apartments'], summary: 'Получить квартиру', parameters: [{ $ref: '#/components/parameters/ApartmentId' }],
        responses: { '200': { description: 'Квартира с рассчитанной оценкой', content: { 'application/json': { schema: { $ref: '#/components/schemas/Apartment' } } } }, '400': { $ref: '#/components/responses/BadRequest' }, '404': { $ref: '#/components/responses/NotFound' } },
      },
    },
    '/apartments/{apartmentId}/reviews': {
      get: {
        tags: ['Reviews'], summary: 'Получить отзывы квартиры',
        parameters: [
          { $ref: '#/components/parameters/ApartmentId' },
          { name: 'sortBy', in: 'query', description: 'Поле сортировки', schema: { type: 'string', enum: ['createdAt', 'rating'], default: 'createdAt' } },
          { name: 'order', in: 'query', description: 'Направление сортировки', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
          { name: 'page', in: 'query', description: 'Номер страницы, начиная с 1', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', description: 'Количество отзывов на странице', schema: { type: 'integer', minimum: 1, maximum: 50, default: 5 } },
        ],
        responses: { '200': { description: 'Страница отзывов', content: { 'application/json': { schema: { $ref: '#/components/schemas/ReviewPage' } } } }, '400': { $ref: '#/components/responses/BadRequest' }, '404': { $ref: '#/components/responses/NotFound' } },
      },
      post: {
        tags: ['Reviews'], summary: 'Создать отзыв', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/ApartmentId' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ReviewInput' }, example: { rating: 5, title: 'Прекрасное место', comment: 'Квартира соответствует фотографиям, всё понравилось.' } } } },
        responses: { '201': { description: 'Отзыв создан', content: { 'application/json': { schema: { $ref: '#/components/schemas/Review' } } } }, '400': { $ref: '#/components/responses/BadRequest' }, '401': { $ref: '#/components/responses/Unauthorized' }, '404': { $ref: '#/components/responses/NotFound' }, '409': { description: 'Пользователь уже оставил отзыв на эту квартиру', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } } },
      },
    },
    '/apartments/{apartmentId}/reviews/me': {
      get: {
        tags: ['Reviews'], summary: 'Получить свой отзыв для квартиры', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/ApartmentId' }],
        responses: {
          '200': { description: 'Собственный отзыв или null, если пользователь ещё не оставлял отзыв', content: { 'application/json': { schema: { $ref: '#/components/schemas/MyReviewResponse' }, examples: { hasReview: { value: { review: { id: 101, apartmentId: 1, userId: 6, rating: 5, title: 'Отличная квартира', comment: 'Чисто, уютно, удобное расположение.', createdAt: '2026-10-12T14:30:00Z', updatedAt: '2026-10-12T14:30:00Z', author: { id: 6, name: 'Анна', avatarUrl: null } } } }, noReview: { value: { review: null } } } } } },
          '401': { $ref: '#/components/responses/Unauthorized' }, '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/apartments/{apartmentId}/reviews/summary': {
      get: {
        tags: ['Reviews'], summary: 'Получить среднюю оценку и количество отзывов', parameters: [{ $ref: '#/components/parameters/ApartmentId' }],
        responses: { '200': { description: 'Сводка отзывов квартиры', content: { 'application/json': { schema: { $ref: '#/components/schemas/ReviewSummary' } } } }, '400': { $ref: '#/components/responses/BadRequest' }, '404': { $ref: '#/components/responses/NotFound' } },
      },
    },
    '/reviews/{reviewId}': {
      patch: {
        tags: ['Reviews'], summary: 'Изменить свой отзыв', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/ReviewId' }],
        requestBody: { required: true, description: 'Передайте одно или несколько полей. Хотя бы одно поле обязательно.', content: { 'application/json': { schema: { $ref: '#/components/schemas/ReviewPatch' }, example: { rating: 4, comment: 'Обновлённый текст отзыва.' } } } },
        responses: { '200': { description: 'Отзыв обновлён', content: { 'application/json': { schema: { $ref: '#/components/schemas/Review' } } } }, '400': { $ref: '#/components/responses/BadRequest' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { description: 'Нельзя изменить чужой отзыв', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } }, '404': { $ref: '#/components/responses/NotFound' } },
      },
      delete: {
        tags: ['Reviews'], summary: 'Удалить свой отзыв', security: [{ bearerAuth: [] }], parameters: [{ $ref: '#/components/parameters/ReviewId' }],
        responses: { '204': { description: 'Отзыв удалён' }, '401': { $ref: '#/components/responses/Unauthorized' }, '403': { description: 'Нельзя удалить чужой отзыв', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } }, '404': { $ref: '#/components/responses/NotFound' } },
      },
    },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Введите JWT, полученный через POST /auth/login. Префикс Bearer добавит Swagger UI.' } },
    parameters: {
      ApartmentId: { name: 'apartmentId', in: 'path', required: true, description: 'Идентификатор квартиры', schema: { type: 'integer', minimum: 1, example: 1 } },
      ReviewId: { name: 'reviewId', in: 'path', required: true, description: 'Идентификатор отзыва', schema: { type: 'integer', minimum: 1, example: 1 } },
    },
    responses: {
      BadRequest: { description: 'Некорректные данные запроса', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' }, example: { statusCode: 400, message: 'Проверьте введённые данные', error: 'Bad Request', fields: { rating: 'Оценка должна быть целым числом от 1 до 5' } } } } },
      Unauthorized: { description: 'Токен отсутствует, недействителен или просрочен', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
      NotFound: { description: 'Квартира или отзыв не найдены', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
    },
    schemas: {
      User: { type: 'object', properties: { id: { type: 'integer', example: 6 }, name: { type: 'string', example: 'Тестовый пользователь' }, email: { type: 'string', format: 'email', example: 'student@example.com' }, avatarUrl: { type: 'string', nullable: true, example: null } } },
      AuthResponse: { type: 'object', required: ['user', 'token'], properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string', description: 'JWT для Bearer-аутентификации' } } },
      Apartment: { type: 'object', properties: { id: { type: 'integer', example: 1 }, title: { type: 'string', example: 'Светлая квартира у набережной' }, address: { type: 'string', example: 'Волжская набережная, 12' }, city: { type: 'string', example: 'Ярославль' }, imageUrl: { type: 'string', nullable: true }, createdAt: { type: 'string', format: 'date-time' }, averageRating: { type: 'number', nullable: true, example: 4.4 }, reviewsCount: { type: 'integer', example: 18 } } },
      Review: { type: 'object', properties: { id: { type: 'integer', example: 101 }, apartmentId: { type: 'integer', example: 1 }, userId: { type: 'integer', example: 6 }, rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 }, title: { type: 'string', example: 'Отличная квартира' }, comment: { type: 'string', example: 'Чисто, уютно, удобное расположение.' }, createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' }, author: { type: 'object', properties: { id: { type: 'integer', example: 6 }, name: { type: 'string', example: 'Анна' }, avatarUrl: { type: 'string', nullable: true, example: null } } } } },
      ReviewPage: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Review' } }, total: { type: 'integer', example: 18 }, page: { type: 'integer', example: 1 }, limit: { type: 'integer', example: 5 }, totalPages: { type: 'integer', example: 4 } } },
      MyReviewResponse: { type: 'object', required: ['review'], properties: { review: { allOf: [{ $ref: '#/components/schemas/Review' }], nullable: true, description: 'null, если пользователь ещё не оставлял отзыв для квартиры' } } },
      ReviewSummary: { type: 'object', properties: { apartmentId: { type: 'integer', example: 1 }, averageRating: { type: 'number', nullable: true, example: 4.4 }, reviewsCount: { type: 'integer', example: 18 } } },
      ReviewInput: { type: 'object', required: ['rating', 'title', 'comment'], properties: { rating: { type: 'integer', minimum: 1, maximum: 5 }, title: { type: 'string', minLength: 3, maxLength: 100 }, comment: { type: 'string', minLength: 10, maxLength: 2000 } } },
      ReviewPatch: { type: 'object', minProperties: 1, properties: { rating: { type: 'integer', minimum: 1, maximum: 5 }, title: { type: 'string', minLength: 3, maxLength: 100 }, comment: { type: 'string', minLength: 10, maxLength: 2000 } }, additionalProperties: false },
      ApiError: { type: 'object', required: ['statusCode', 'message', 'error'], properties: { statusCode: { type: 'integer', example: 400 }, message: { type: 'string', example: 'Проверьте введённые данные' }, error: { type: 'string', example: 'Bad Request' }, fields: { type: 'object', additionalProperties: { type: 'string' } } } },
    },
  },
} as const;
