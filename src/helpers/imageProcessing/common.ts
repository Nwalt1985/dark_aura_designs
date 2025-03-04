/**
 * Common Image Processing Utilities
 *
 * This module provides common utility functions for image processing
 * that are shared across different product types.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { Logger, handleError, ValidationError } from '../../errors';

/**
 * Validates if a directory exists and creates it if it doesn't.
 *
 * @param {string} directoryPath - The path of the directory to validate and create
 * @throws {ValidationError} If directory creation fails
 */
export function validateAndCreateDirectory(directoryPath: string): void {
  try {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError(`Failed to create directory: ${directoryPath}`, error);
  }
}

/**
 * Processes an image with the specified dimensions and optional transformations.
 *
 * @param {Buffer} buffer - The image buffer to process
 * @param {number} width - The target width for the image
 * @param {number} height - The target height for the image
 * @param {Object} [options] - Optional transformation parameters
 * @param {number} [options.rotate] - Rotation angle in degrees
 * @param {Object} [options.extract] - Extraction region parameters
 * @param {keyof sharp.FitEnum} [options.fit] - Fit method for resizing
 * @param {string} [options.position] - Position for cropping
 * @returns {Promise<Buffer>} A promise that resolves to the processed image buffer
 * @throws {ValidationError} If image processing fails
 */
export async function processImage(
  buffer: Buffer,
  width: number,
  height: number,
  options?: {
    rotate?: number;
    extract?: { left: number; top: number; width: number; height: number };
    fit?: keyof sharp.FitEnum;
    position?: string;
  },
): Promise<Buffer> {
  try {
    let sharpInstance = sharp(buffer);

    if (options?.rotate) {
      sharpInstance = sharpInstance.rotate(options.rotate);
    }

    const resizeOptions: sharp.ResizeOptions = {
      fit: options?.fit as keyof sharp.FitEnum,
      position: options?.position,
    };

    sharpInstance = sharpInstance.resize(width, height, resizeOptions);

    if (options?.extract) {
      sharpInstance = sharpInstance.extract(options.extract);
    }

    return await sharpInstance.jpeg().toBuffer();
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError('Failed to process image', error);
  }
}

/**
 * Creates a date-formatted directory for storing processed images.
 *
 * @param {string} baseDir - Base directory path
 * @param {string} formattedDate - Formatted date string (DD-MM-YYYY)
 * @returns {string} Path to the created directory
 */
export function createDateDirectory(baseDir: string, formattedDate: string): string {
  const dateDir = path.resolve(baseDir, formattedDate);
  validateAndCreateDirectory(dateDir);
  return dateDir;
}
