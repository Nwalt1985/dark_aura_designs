/**
 * Common Image Processing Utilities
 *
 * This module provides common utility functions for image processing
 * that are shared across different product types.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Logger, handleError, ValidationError } from '../../errors';

// Simple in-memory cache for processed images
interface CacheEntry {
  buffer: Buffer;
  timestamp: number;
}

// Cache configuration
const CACHE_MAX_SIZE = 100; // Maximum number of items in cache
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes TTL
const imageCache = new Map<string, CacheEntry>();

/**
 * Generates a cache key for an image processing operation
 *
 * @param {Buffer} buffer - The image buffer
 * @param {Object} params - Processing parameters
 * @returns {string} A unique cache key
 */
function generateCacheKey(
  buffer: Buffer,
  params: {
    width: number;
    height: number;
    rotate?: number;
    extract?: { left: number; top: number; width: number; height: number };
    fit?: keyof sharp.FitEnum;
    position?: string;
  },
): string {
  // Create a hash of the buffer content - using a small sample of the buffer for performance
  const sampleSize = Math.min(1024, buffer.length);
  const sample = buffer.subarray(0, sampleSize);
  const bufferHash = crypto.createHash('md5').update(sample.toString('binary')).digest('hex');

  // Combine with processing parameters
  const paramsString = JSON.stringify(params);
  return `${bufferHash}_${paramsString}`;
}

/**
 * Manages the image cache to prevent it from growing too large
 */
function manageCache(): void {
  if (imageCache.size <= CACHE_MAX_SIZE) return;

  // If cache exceeds max size, remove oldest entries
  const now = Date.now();
  const entries = Array.from(imageCache.entries());

  // First remove expired entries
  const expiredEntries = entries.filter(([_, entry]) => now - entry.timestamp > CACHE_TTL);
  expiredEntries.forEach(([key]) => imageCache.delete(key));

  // If still too large, remove oldest entries
  if (imageCache.size > CACHE_MAX_SIZE) {
    const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const entriesToRemove = sortedEntries.slice(0, sortedEntries.length - CACHE_MAX_SIZE);
    entriesToRemove.forEach(([key]) => imageCache.delete(key));
  }
}

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
 * Uses caching to improve performance for repeated operations.
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
    // Check if we have this image in cache
    const cacheKey = generateCacheKey(buffer, { width, height, ...options });
    const cachedImage = imageCache.get(cacheKey);

    if (cachedImage && Date.now() - cachedImage.timestamp < CACHE_TTL) {
      Logger.info('Using cached image');
      return cachedImage.buffer;
    }

    // Process the image if not in cache
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

    const processedBuffer = await sharpInstance.jpeg().toBuffer();

    // Store in cache
    imageCache.set(cacheKey, {
      buffer: processedBuffer,
      timestamp: Date.now(),
    });

    // Manage cache size
    manageCache();

    return processedBuffer;
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
