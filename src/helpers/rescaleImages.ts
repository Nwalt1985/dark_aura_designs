/**
 * Image Processing Module
 *
 * This module provides functions for processing and resizing images for various product types.
 * It handles the creation of different image sizes and formats required for product listings
 * across different marketplaces, including mockups and full-size product images.
 *
 * The module supports various product types including desk mats, pillows, blankets, and woven blankets,
 * with specialized processing for each product type's specific requirements.
 */
import sharp from 'sharp';
import fs from 'fs';
import { createFile } from '.';
import { Logger, handleError, ValidationError } from '../errors';
import path from 'path';

/**
 * Validates if a directory exists and creates it if it doesn't.
 *
 * @param {string} directoryPath - The path of the directory to validate and create
 * @throws {ValidationError} If directory creation fails
 */
function validateAndCreateDirectory(directoryPath: string): void {
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
async function processImage(
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
  const directoryPath = path.join(baseDir, formattedDate);
  validateAndCreateDirectory(directoryPath);

  try {
    await Promise.all([
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-2543x1254.jpg`,
        await processImage(buffer, 2543, 1254),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-4320x3630.jpg`,
        await processImage(buffer, 4320, 3630),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-7080x4140.jpg`,
        await processImage(buffer, 7080, 4140),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-9450x4650.jpg`,
        await processImage(buffer, 9450, 4650),
      ),
    ]);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError('Failed to resize desk mat images', error);
  }
}

/**
 * Resizes pillow images to various dimensions required for product listings.
 * Creates both a mockup version and a full-size version of the image.
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
  const directoryPath = path.join(baseDir, formattedDate);
  validateAndCreateDirectory(directoryPath);

  try {
    await Promise.all([
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-1275x1275.jpg`,
        await processImage(buffer, 1275, 1275),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-4050x4050.jpg`,
        await processImage(buffer, 4050, 4050),
      ),
    ]);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError('Failed to resize pillow images', error);
  }
}

/**
 * Resizes blanket images to various dimensions required for product listings.
 * Handles both portrait and landscape orientations, creating multiple versions
 * including mockups, rotated versions, and cropped versions as needed.
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
  const directoryPath = path.join(baseDir, formattedDate);
  validateAndCreateDirectory(directoryPath);

  try {
    if (filename.includes('_portrait')) {
      await Promise.all([
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-826x1063.jpg`,
          await processImage(buffer, 826, 1063),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-rotated-1063x826.jpg`,
          await processImage(buffer, 1063, 826, { rotate: 270 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-cropped-1200x1600.jpg`,
          await processImage(buffer, 2000, 1523, {
            extract: { left: 0, top: 0, width: 1600, height: 1200 },
          }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-4252x3307.jpg`,
          await processImage(buffer, 4252, 3307, { rotate: 270 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-6299x5276.jpg`,
          await processImage(buffer, 6299, 5276, { rotate: 270 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-8228x6260.jpg`,
          await processImage(buffer, 8228, 6260, { rotate: 270 }),
        ),
      ]);
    } else {
      await Promise.all([
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-1063x826.jpg`,
          await processImage(buffer, 1063, 826),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-rotated-826x1063.jpg`,
          await processImage(buffer, 826, 1063, { rotate: 270 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-cropped-1200x1600.jpg`,
          await processImage(buffer, 2000, 1523, {
            rotate: 90,
            extract: { left: 0, top: 0, width: 1600, height: 1200 },
          }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-4252x3307.jpg`,
          await processImage(buffer, 4252, 3307),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-6299x5276.jpg`,
          await processImage(buffer, 6299, 5276),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-8228x6260.jpg`,
          await processImage(buffer, 8228, 6260),
        ),
      ]);
    }
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError('Failed to resize blanket images', error);
  }
}

/**
 * Resizes woven blanket images to various dimensions required for product listings.
 * Handles both portrait and landscape orientations, creating multiple versions
 * with different dimensions and rotations as needed.
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
  const directoryPath = path.join(baseDir, formattedDate);
  validateAndCreateDirectory(directoryPath);

  try {
    if (filename.includes('_portrait')) {
      await Promise.all([
        createFile(
          directoryPath,
          `${filename}-${fileId}-4992x3552.jpg`,
          await processImage(buffer, 4992, 3552, { rotate: 270 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-5760x4800.jpg`,
          await processImage(buffer, 5760, 4800, { rotate: 270 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-7680x5760.jpg`,
          await processImage(buffer, 7680, 5760, { rotate: 270 }),
        ),
      ]);

      // Create Mockups - Portrait
      await Promise.all([
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-2868x3442.jpg`,
          await processImage(buffer, 2868, 3442),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-9601x8000.jpg`,
          await processImage(buffer, 9601, 8000),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-rotated-3613x3037.jpg`,
          await processImage(buffer, 3613, 3037, { rotate: 90 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-cropped-4290x2910.jpg`,
          await processImage(buffer, 11520, 15360, {
            fit: 'cover',
            position: 'north',
            extract: { left: 7200, top: 0, width: 4290, height: 2910 },
          }),
        ),
      ]);

      // Create Mockups - Landscape
      await Promise.all([
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-rotated-3613x3037.jpg`,
          await processImage(buffer, 3613, 3037, { rotate: 90 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-rotated-2868x3442.jpg`,
          await processImage(buffer, 2868, 3442, { rotate: 90 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-cropped-4290x2910.jpg`,
          await processImage(buffer, 15360, 11520, {
            fit: 'cover',
            position: 'north',
            extract: { left: 11000, top: 0, width: 4290, height: 2910 },
          }),
        ),
      ]);
    } else {
      await Promise.all([
        createFile(
          directoryPath,
          `${filename}-${fileId}-4992x3552.jpg`,
          await processImage(buffer, 4992, 3552),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-5760x4800.jpg`,
          await processImage(buffer, 5760, 4800),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-7680x5760.jpg`,
          await processImage(buffer, 7680, 5760),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-3613x3037.jpg`,
          await processImage(buffer, 3613, 3037),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-8000x9601.jpg`,
          await processImage(buffer, 8000, 9601),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-rotated-2868x3442.jpg`,
          await processImage(buffer, 2868, 3442, { rotate: 90 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-cropped-4290x2910.jpg`,
          await processImage(buffer, 15360, 11520, {
            fit: 'cover',
            position: 'north',
            extract: { left: 11000, top: 0, width: 4290, height: 2910 },
          }),
        ),
      ]);
    }
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError('Failed to resize woven blanket images', error);
  }
}
