/**
 * Blanket Image Processing Module
 *
 * This module provides specialized functions for processing blanket images.
 * It handles the creation of different image sizes and formats required for
 * blanket product listings.
 */
import { createFile } from '../fileSystem';
import { Logger, handleError, ValidationError } from '../../errors';
import { processImage, createDateDirectory } from './common';

/**
 * Resizes blanket images to various dimensions required for product listings.
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
export async function resizeBlanketImage(
  buffer: Buffer,
  filename: string,
  fileId: number,
  baseDir: string,
  formattedDate: string,
): Promise<void> {
  try {
    const dateDir = createDateDirectory(baseDir, formattedDate);

    if (filename.includes('_portrait')) {
      // Process portrait-oriented blanket images

      // Create the main product image (8228x6260)
      const image1Buffer = await processImage(buffer, 8228, 6260, {
        rotate: 270,
      });
      await createFile(dateDir, `${filename}-${fileId}-8228x6260.jpg`, image1Buffer);

      // Create image 6299x5276
      const image2Buffer = await processImage(buffer, 6299, 5276, {
        rotate: 270,
        fit: 'contain',
        position: 'center',
      });
      await createFile(dateDir, `${filename}-${fileId}-6299x5276.jpg`, image2Buffer);

      // Create image 4252x3307
      const image3Buffer = await processImage(buffer, 4252, 3307, {
        rotate: 270,
        fit: 'contain',
        position: 'center',
      });
      await createFile(dateDir, `${filename}-${fileId}-4252x3307.jpg`, image3Buffer);

      // Create mockup image 826x1063
      const image4Buffer = await processImage(buffer, 826, 1063, {
        fit: 'contain',
        position: 'center',
      });
      await createFile(dateDir, `${filename}-${fileId}-mockup-826x1063.jpg`, image4Buffer);

      // Create cropped mockup image 1200x1600
      const image5Buffer = await processImage(buffer, 2000, 1523, {
        fit: 'contain',
        position: 'center',
        extract: {
          left: 0,
          top: 0,
          width: 1600,
          height: 1200,
        },
      });
      await createFile(dateDir, `${filename}-${fileId}-mockup-cropped-1200x1600.jpg`, image5Buffer);

      // Create rotated mockup image 1063x826
      const image6Buffer = await processImage(buffer, 1063, 826, {
        rotate: 270,
        fit: 'contain',
        position: 'center',
      });
      await createFile(dateDir, `${filename}-${fileId}-mockup-rotated-1063x826.jpg`, image6Buffer);
    } else {
      // Process standard blanket images

      // Create the main product image (8228x6260)
      const image1Buffer = await processImage(buffer, 8228, 6260);
      await createFile(dateDir, `${filename}-${fileId}-8228x6260.jpg`, image1Buffer);

      // Create image 6299x5276
      const image2Buffer = await processImage(buffer, 6299, 5276, {
        fit: 'contain',
        position: 'center',
      });
      await createFile(dateDir, `${filename}-${fileId}-6299x5276.jpg`, image2Buffer);

      // Create image 4252x3307
      const image3Buffer = await processImage(buffer, 4252, 3307, {
        fit: 'contain',
        position: 'center',
      });
      await createFile(dateDir, `${filename}-${fileId}-4252x3307.jpg`, image3Buffer);

      // Create mockup image 1063x826
      const image4Buffer = await processImage(buffer, 1063, 826, {
        fit: 'contain',
        position: 'center',
      });
      await createFile(dateDir, `${filename}-${fileId}-mockup-1063x826.jpg`, image4Buffer);

      // Create rotated mockup image 826x1063
      const image5Buffer = await processImage(buffer, 826, 1063, {
        rotate: 270,
        fit: 'contain',
        position: 'center',
      });
      await createFile(dateDir, `${filename}-${fileId}-mockup-rotated-826x1063.jpg`, image5Buffer);

      // Create cropped mockup image 1200x1600
      const image6Buffer = await processImage(buffer, 2000, 1523, {
        rotate: 90,
        fit: 'contain',
        position: 'center',
        extract: {
          left: 0,
          top: 0,
          width: 1600,
          height: 1200,
        },
      });
      await createFile(dateDir, `${filename}-${fileId}-mockup-cropped-1200x1600.jpg`, image6Buffer);
    }

    Logger.info(`Successfully processed blanket images for ${filename}`);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError(`Failed to resize blanket images for ${filename}`, error);
  }
}
