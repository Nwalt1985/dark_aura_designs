/**
 * Error Handling Module
 *
 * This module provides a standardized error handling system for the application.
 * It defines error types, error response structure, and custom error classes
 * to ensure consistent error handling and reporting throughout the application.
 */

/**
 * Enumeration of error types used throughout the application.
 * Each type represents a specific category of error for better error handling and reporting.
 */
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

/**
 * Standard structure for error responses.
 * Used to ensure consistent error reporting across the application.
 */
export interface ErrorResponse {
  type: ErrorType;
  message: string;
  code: number;
  details?: unknown;
  stack?: string;
  context?: Record<string, unknown>;
}

/**
 * Base custom error class that extends the standard Error class.
 * Provides additional properties for error type, code, and details.
 */
export class CustomError extends Error {
  public readonly type: ErrorType;
  public readonly code: number;
  public readonly details?: unknown;

  /**
   * Creates a new CustomError instance.
   *
   * @param {ErrorType} type - The type of error
   * @param {string} message - Error message
   * @param {number} code - HTTP status code or custom error code
   * @param {unknown} [details] - Additional error details
   */
  constructor(type: ErrorType, message: string, code: number, details?: unknown) {
    super(message);
    this.type = type;
    this.code = code;
    this.details = details;
    this.name = this.constructor.name;
    // Check if captureStackTrace is available (it may not be in all environments)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts the error to a standard JSON format.
   *
   * @returns {ErrorResponse} Standardized error response object
   */
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

/**
 * Specialized error class for validation errors.
 * Used when input data fails validation checks.
 */
export class ValidationError extends CustomError {
  /**
   * Creates a new ValidationError instance.
   *
   * @param {string} message - Error message
   * @param {unknown} [details] - Additional error details
   */
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
