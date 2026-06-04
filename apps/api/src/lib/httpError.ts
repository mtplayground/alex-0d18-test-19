export class HttpError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
