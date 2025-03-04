/* eslint-disable no-console */
/**
 * Logger Module
 *
 * This module provides a centralized logging system for the application.
 * It offers methods for logging errors, warnings, info, and debug messages
 * with consistent formatting and appropriate detail levels.
 */
import { ErrorResponse } from './CustomError';

/**
 * Logger class that provides static methods for different logging levels.
 * Formats log messages consistently and handles different types of log data.
 */
export class Logger {
  /**
   * Formats an error response object into a readable string.
   * Includes timestamp, error type, code, message, and optional details or stack trace.
   *
   * @param {ErrorResponse} error - The error response object to format
   * @returns {string} Formatted error string
   * @private
   */
  private static formatError(error: ErrorResponse): string {
    const timestamp = new Date().toISOString();
    const baseInfo = `[${timestamp}] [${error.type}] [${error.code}] ${error.message}`;

    if (error.details) {
      return `${baseInfo}\nDetails: ${JSON.stringify(error.details, null, 2)}`;
    }

    if (error.stack) {
      return `${baseInfo}\nStack: ${error.stack}`;
    }

    return baseInfo;
  }

  /**
   * Logs an error message to the console.
   * Uses the formatError method to ensure consistent error formatting.
   *
   * @param {ErrorResponse} error - The error response object to log
   */
  static error(error: ErrorResponse): void {
    const formattedError = this.formatError(error);
    console.error(formattedError);
  }

  /**
   * Logs a warning message to the console.
   * Includes timestamp and optional details.
   *
   * @param {string} message - The warning message to log
   * @param {unknown} [details] - Optional additional details
   */
  static warn(message: string, details?: unknown): void {
    console.warn(`[${new Date().toISOString()}] [WARN] ${message}`, details || '');
  }

  /**
   * Logs an informational message to the console.
   * Includes timestamp and optional details.
   *
   * @param {string} message - The info message to log
   * @param {unknown} [details] - Optional additional details
   */
  static info(message: string, details?: unknown): void {
    console.info(`[${new Date().toISOString()}] [INFO] ${message}`, details || '');
  }

  /**
   * Logs a debug message to the console.
   * Only logs in non-production environments.
   * Includes timestamp and optional details.
   *
   * @param {string} message - The debug message to log
   * @param {unknown} [details] - Optional additional details
   */
  static debug(message: string, details?: unknown): void {
    if (process.env['NODE_ENV'] !== 'production') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] ${message}`, details || '');
    }
  }
}
