/**
 * Error Handler Module
 *
 * This module provides a centralized error handling function that converts
 * various error types into a standardized error response format.
 * It handles custom errors, validation errors, external service errors,
 * and unknown errors to ensure consistent error reporting.
 */
import { StatusCodes } from 'http-status-codes';
import { CustomError, ErrorType, ErrorResponse } from './CustomError';
import { ZodError } from 'zod';
import { AxiosError } from 'axios';

/**
 * Captures additional context information about the current execution environment
 * to help with debugging and error analysis.
 *
 * @returns {Record<string, unknown>} Object containing context information
 */
function captureErrorContext(): Record<string, unknown> {
  return {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    // Add any other relevant context information
  };
}

/**
 * Converts any error type into a standardized error response.
 * Handles different error classes differently to extract the most relevant information.
 *
 * @param {unknown} error - The error to handle (can be any type)
 * @returns {ErrorResponse} Standardized error response object
 */
export function handleError(error: unknown): ErrorResponse {
  const context = captureErrorContext();

  // Already handled errors
  if (error instanceof CustomError) {
    const errorResponse = error.toJSON();
    return {
      ...errorResponse,
      context,
    };
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return {
      type: ErrorType.VALIDATION,
      message: 'Validation error',
      code: StatusCodes.BAD_REQUEST,
      details: error.errors,
      context,
    };
  }

  // Axios errors
  if (error instanceof AxiosError) {
    return {
      type: ErrorType.EXTERNAL_SERVICE,
      message: error.message,
      code: error.response?.status || StatusCodes.BAD_GATEWAY,
      details: {
        data: error.response?.data as Record<string, unknown>,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        },
      },
      context,
    };
  }

  // Standard Error object
  if (error instanceof Error) {
    return {
      type: ErrorType.INTERNAL,
      message: error.message,
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      stack: error.stack,
      context,
    };
  }

  // Unknown errors
  return {
    type: ErrorType.INTERNAL,
    message: 'An unexpected error occurred',
    code: StatusCodes.INTERNAL_SERVER_ERROR,
    details: error,
    context,
  };
}
