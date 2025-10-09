export class APIError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;

    // Fix prototype chain
    Object.setPrototypeOf(this, APIError.prototype);

    // Capture stack trace (optional but recommended)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }
}
