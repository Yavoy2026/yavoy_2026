/** Доменная ошибка: код стабилен, по нему матчится клиент (спека §2) */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (code: string, message: string) => new AppError(404, code, message);
export const unauthorized = (code: string, message: string) => new AppError(401, code, message);
export const forbidden = (code: string, message: string) => new AppError(403, code, message);
export const conflict = (code: string, message: string) => new AppError(409, code, message);
export const badRequest = (code: string, message: string) => new AppError(400, code, message);
export const tooManyRequests = (code: string, message: string, details?: Record<string, unknown>) =>
  new AppError(429, code, message, details);
export const serviceUnavailable = (code: string, message: string) => new AppError(503, code, message);
