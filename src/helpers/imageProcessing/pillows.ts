/**
 * Pillow Image Processing Module
 *
 * This module provides specialized functions for processing pillow images.
 * It handles the creation of different image sizes and formats required for
 * pillow product listings.
 */
import { createFile } from '../fileSystem';
import { Logger, handleError, ValidationError } from '../../errors';
import { processImage, createDateDirectory } from './common';

/**
 * Resizes pillow images to various dimensions required for product listings.
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
export async function resizePillowImage(
  buffer: Buffer,
  filename: string,
  fileId: number,
  baseDir: string,
  formattedDate: string,
): Promise<void> {
  try {
    const dateDir = createDateDirectory(baseDir, formattedDate);

    // Create the main product image (4050x4050)
    const image1Buffer = await processImage(buffer, 4050, 4050);
    await createFile(dateDir, `${filename}-${fileId}-4050x4050.jpg`, image1Buffer);

    // Create the mockup image (1000x1000)
    const image2Buffer = await processImage(buffer, 1275, 1275, {
      fit: 'contain',
      position: 'center',
    });
    await createFile(dateDir, `${filename}-${fileId}-mockup-1275x1275.jpg`, image2Buffer);

    Logger.info(`Successfully processed pillow images for ${filename}`);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError(`Failed to resize pillow images for ${filename}`, error);
  }
}
