export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public error: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const badRequest = (message: string, fields?: Record<string, string>) =>
  new ApiError(400, message, 'Bad Request', fields);
export const notFound = (message: string) => new ApiError(404, message, 'Not Found');
