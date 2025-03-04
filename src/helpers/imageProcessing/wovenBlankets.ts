/**
 * Woven Blanket Image Processing Module
 *
 * This module provides specialized functions for processing woven blanket images.
 * It handles the creation of different image sizes and formats required for
 * woven blanket product listings.
 */
import { createFile } from '../fileSystem';
import { Logger, handleError, ValidationError } from '../../errors';
import { processImage, createDateDirectory } from './common';

/**
 * Resizes woven blanket images to various dimensions required for product listings.
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
export async function resizeWovenBlanketImage(
  buffer: Buffer,
  filename: string,
  fileId: number,
  baseDir: string,
  formattedDate: string,
): Promise<void> {
  try {
    const dateDir = createDateDirectory(baseDir, formattedDate);

    if (filename.includes('_portrait')) {
      // Process portrait-oriented woven blanket images

      // Create the main product images
      const image1Buffer = await processImage(buffer, 7680, 5760, {
        rotate: 270,
      });
      await createFile(dateDir, `${filename}-${fileId}-7680x5760.jpg`, image1Buffer);

      const image2Buffer = await processImage(buffer, 5760, 4800, {
        rotate: 270,
      });
      await createFile(dateDir, `${filename}-${fileId}-5760x4800.jpg`, image2Buffer);

      const image3Buffer = await processImage(buffer, 4992, 3552, {
        rotate: 270,
      });
      await createFile(dateDir, `${filename}-${fileId}-4992x3552.jpg`, image3Buffer);

      // Create mockup images - Portrait
      const mockup1Buffer = await processImage(buffer, 2868, 3442);
      await createFile(dateDir, `${filename}-${fileId}-mockup-2868x3442.jpg`, mockup1Buffer);

      const mockup2Buffer = await processImage(buffer, 9601, 8000);
      await createFile(dateDir, `${filename}-${fileId}-mockup-9601x8000.jpg`, mockup2Buffer);

      const mockup3Buffer = await processImage(buffer, 3613, 3037, {
        rotate: 90,
      });
      await createFile(
        dateDir,
        `${filename}-${fileId}-mockup-rotated-3613x3037.jpg`,
        mockup3Buffer,
      );

      const mockup4Buffer = await processImage(buffer, 11520, 15360, {
        fit: 'cover',
        position: 'north',
        extract: {
          left: 7200,
          top: 0,
          width: 4290,
          height: 2910,
        },
      });
      await createFile(
        dateDir,
        `${filename}-${fileId}-mockup-cropped-4290x2910.jpg`,
        mockup4Buffer,
      );
    } else {
      // Process standard woven blanket images

      // Create the main product images
      const image1Buffer = await processImage(buffer, 7680, 5760);
      await createFile(dateDir, `${filename}-${fileId}-7680x5760.jpg`, image1Buffer);

      const image2Buffer = await processImage(buffer, 5760, 4800);
      await createFile(dateDir, `${filename}-${fileId}-5760x4800.jpg`, image2Buffer);

      const image3Buffer = await processImage(buffer, 4992, 3552);
      await createFile(dateDir, `${filename}-${fileId}-4992x3552.jpg`, image3Buffer);

      // Create mockup images - Landscape
      const mockup1Buffer = await processImage(buffer, 3613, 3037);
      await createFile(dateDir, `${filename}-${fileId}-mockup-3613x3037.jpg`, mockup1Buffer);

      const mockup2Buffer = await processImage(buffer, 8000, 9601);
      await createFile(dateDir, `${filename}-${fileId}-mockup-8000x9601.jpg`, mockup2Buffer);

      const mockup3Buffer = await processImage(buffer, 2868, 3442, {
        rotate: 90,
      });
      await createFile(
        dateDir,
        `${filename}-${fileId}-mockup-rotated-2868x3442.jpg`,
        mockup3Buffer,
      );

      const mockup4Buffer = await processImage(buffer, 15360, 11520, {
        fit: 'cover',
        position: 'north',
        extract: {
          left: 11000,
          top: 0,
          width: 4290,
          height: 2910,
        },
      });
      await createFile(
        dateDir,
        `${filename}-${fileId}-mockup-cropped-4290x2910.jpg`,
        mockup4Buffer,
      );
    }

    Logger.info(`Successfully processed woven blanket images for ${filename}`);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError(`Failed to resize woven blanket images for ${filename}`, error);
  }
}
