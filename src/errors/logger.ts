/* eslint-disable no-console */
import { ErrorResponse } from './CustomError';

export class Logger {
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

  static error(error: ErrorResponse): void {
    const formattedError = this.formatError(error);
    console.error(formattedError);
  }

  static warn(message: string, details?: unknown): void {
    console.warn(`[${new Date().toISOString()}] [WARN] ${message}`, details || '');
  }

  static info(message: string, details?: unknown): void {
    console.info(`[${new Date().toISOString()}] [INFO] ${message}`, details || '');
  }

  static debug(message: string, details?: unknown): void {
    if (process.env['NODE_ENV'] !== 'production') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] ${message}`, details || '');
    }
  }
}
