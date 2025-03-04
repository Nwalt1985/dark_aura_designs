import { StatusCodes } from 'http-status-codes';
import { CustomError, ErrorType, ErrorResponse } from './CustomError';
import { ZodError } from 'zod';
import { AxiosError } from 'axios';

export function handleError(error: unknown): ErrorResponse {
  // Already handled errors
  if (error instanceof CustomError) {
    return error.toJSON();
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    return {
      type: ErrorType.VALIDATION,
      message: 'Validation error',
      code: StatusCodes.BAD_REQUEST,
      details: error.errors,
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
    };
  }

  // Standard Error object
  if (error instanceof Error) {
    return {
      type: ErrorType.INTERNAL,
      message: error.message,
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      stack: error.stack,
    };
  }

  // Unknown errors
  return {
    type: ErrorType.INTERNAL,
    message: 'An unexpected error occurred',
    code: StatusCodes.INTERNAL_SERVER_ERROR,
    details: error,
  };
}
