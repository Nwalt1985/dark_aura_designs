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
    const mainImageBuffer = await processImage(buffer, 4050, 4050);
    await createFile(dateDir, `${filename}-${fileId}-4050x4050.jpg`, mainImageBuffer);

    // Create the thumbnail image (1500x1500)
    const thumbnailBuffer = await processImage(buffer, 1500, 1500, {
      fit: 'contain',
      position: 'center',
    });
    await createFile(dateDir, `${filename}-${fileId}-1500x1500.jpg`, thumbnailBuffer);

    // Create the mockup image (1000x1000)
    const mockupBuffer = await processImage(buffer, 1000, 1000, {
      fit: 'contain',
      position: 'center',
    });
    await createFile(dateDir, `${filename}-${fileId}-1000x1000.jpg`, mockupBuffer);

    // Create the small mockup image (570x570)
    const smallMockupBuffer = await processImage(buffer, 570, 570, {
      fit: 'contain',
      position: 'center',
    });
    await createFile(dateDir, `${filename}-${fileId}-570x570.jpg`, smallMockupBuffer);

    Logger.info(`Successfully processed pillow images for ${filename}`);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError(`Failed to resize pillow images for ${filename}`, error);
  }
}
