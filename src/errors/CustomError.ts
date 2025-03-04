export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  DATABASE = 'DATABASE',
  INTERNAL = 'INTERNAL',
}

export interface ErrorResponse {
  type: ErrorType;
  message: string;
  code: number;
  details?: unknown;
  stack?: string;
}

export class CustomError extends Error {
  public readonly type: ErrorType;
  public readonly code: number;
  public readonly details?: unknown;

  constructor(type: ErrorType, message: string, code: number, details?: unknown) {
    super(message);
    this.type = type;
    this.code = code;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): ErrorResponse {
    return {
      type: this.type,
      message: this.message,
      code: this.code,
      details: this.details,
      stack: this.stack,
    };
  }
}

export class ValidationError extends CustomError {
  constructor(message: string, details?: unknown) {
    super(ErrorType.VALIDATION, message, 400, details);
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string, details?: unknown) {
    super(ErrorType.AUTHENTICATION, message, 401, details);
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string, details?: unknown) {
    super(ErrorType.AUTHORIZATION, message, 403, details);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string, details?: unknown) {
    super(ErrorType.NOT_FOUND, message, 404, details);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string, details?: unknown) {
    super(ErrorType.CONFLICT, message, 409, details);
  }
}

export class ExternalServiceError extends CustomError {
  constructor(message: string, details?: unknown) {
    super(ErrorType.EXTERNAL_SERVICE, message, 502, details);
  }
}

export class DatabaseError extends CustomError {
  constructor(message: string, details?: unknown) {
    super(ErrorType.DATABASE, message, 503, details);
  }
}

export class InternalError extends CustomError {
  constructor(message: string, details?: unknown) {
    super(ErrorType.INTERNAL, message, 500, details);
  }
}
