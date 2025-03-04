/**
 * Desk Mat Image Processing Module
 *
 * This module provides specialized functions for processing desk mat images.
 * It handles the creation of different image sizes and formats required for
 * desk mat product listings.
 */
import { createFile } from '../fileSystem';
import { Logger, handleError, ValidationError } from '../../errors';
import { processImage, createDateDirectory } from './common';

/**
 * Resizes desk mat images to various dimensions required for product listings.
 * Creates multiple versions of the image with different dimensions.
 *
 * @param {Buffer} buffer - The original image buffer
 * @param {string} filename - Base filename for the resized images
 * @param {number} fileId - Unique identifier for the file
 * @param {string} baseDir - Base directory for storing the images
 * @param {string} formattedDate - Formatted date string for the subdirectory
 * @returns {Promise<void>} A promise that resolves when all images have been processed
 * @throws {ValidationError} If image resizing fails
 */
export async function resizeDeskmats(
  buffer: Buffer,
  filename: string,
  fileId: number,
  baseDir: string,
  formattedDate: string,
): Promise<void> {
  try {
    const dateDir = createDateDirectory(baseDir, formattedDate);

    // Create the main product image (9450x4650)
    const image1Buffer = await processImage(buffer, 9450, 4650);
    await createFile(dateDir, `${filename}-${fileId}-9450x4650.jpg`, image1Buffer);

    // Create the image (7080x4140)
    const image2Buffer = await processImage(buffer, 7080, 4140, {
      fit: 'contain',
      position: 'center',
    });
    await createFile(dateDir, `${filename}-${fileId}-7080x4140.jpg`, image2Buffer);

    // Create the image (4320x3630)
    const image3Buffer = await processImage(buffer, 4320, 3630, {
      fit: 'contain',
      position: 'center',
    });
    await createFile(dateDir, `${filename}-${fileId}-4320x3630.jpg`, image3Buffer);

    // Create the mockup image (2543x1254)
    const mockupBuffer = await processImage(buffer, 2543, 1254, {
      fit: 'contain',
      position: 'center',
    });
    await createFile(dateDir, `${filename}-${fileId}-mockup-2543x1254.jpg`, mockupBuffer);

    Logger.info(`Successfully processed desk mat images for ${filename}`);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError(`Failed to resize desk mat images for ${filename}`, error);
  }
}
