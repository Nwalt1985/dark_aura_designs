/**
 * File System Utilities Module
 *
 * This module provides utility functions for file system operations.
 */
import fs from 'fs';
import path from 'path';
import { Product } from '../models/types/listing';
import { Logger, handleError } from '../errors';
import { extractImageId } from './dateUtils';

/**
 * Retrieves image buffers from date-formatted subfolders matching a specific filename.
 * Searches through date-formatted directories (DD-MM-YYYY) for files containing the specified filename.
 *
 * @param {string} fileName - Partial filename to search for
 * @param {string} baseDir - Base directory to search in
 * @returns {Array<{filename: string, fileId: string | null, base64: Buffer}>} Array of objects containing filename, fileId, and image buffer
 */
export function getBuffer(
  fileName: string,
  baseDir: string,
): {
  filename: string;
  fileId: string | null;
  base64: Buffer;
}[] {
  const buffer: {
    filename: string;
    fileId: string | null;
    base64: Buffer;
  }[] = [];

  fs.readdirSync(baseDir).forEach((dir) => {
    if (dir.includes('.DS_Store') || dir.includes('._')) {
      return;
    }

    if (dir.match(/\d{2}-\d{2}-\d{4}/)) {
      const folder = path.resolve(baseDir, dir);

      fs.readdirSync(folder).forEach((file) => {
        if (file.includes('.DS_Store') || file.includes('._')) {
          return;
        }

        const filePath = path.resolve(folder, file);

        if (file.includes(fileName)) {
          buffer.push({
            filename: file,
            fileId: extractImageId(file),
            base64: fs.readFileSync(filePath),
          });
        }
      });
    }
  });

  return buffer;
}

/**
 * Moves processed image files from the rescale directory to the completed directory.
 * Handles both .png and .jpg file extensions and creates the completed directory if needed.
 *
 * @param {Product} product - Product configuration object containing directory paths
 * @param {string} fileName - Base filename without extension
 * @throws Will log error if file operations fail
 */
export function relocateRescaleImage(product: Product, fileName: string): void {
  try {
    const rescaleDir = product.rescale;
    const completedDir = product.completedRescalePath;

    // Create completed_rescale directory if it doesn't exist
    if (!fs.existsSync(completedDir)) {
      fs.mkdirSync(completedDir, { recursive: true });
    }

    const fileExtensions = ['.png', '.jpg'];

    fileExtensions.forEach((extension) => {
      const sourceFile = path.resolve(rescaleDir, `${fileName}${extension}`);
      const targetFile = path.resolve(completedDir, `${fileName}${extension}`);

      if (fs.existsSync(sourceFile)) {
        fs.renameSync(sourceFile, targetFile);
        Logger.info(`Moved ${fileName}${extension} to completed_rescale directory`);
      }
    });
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw error;
  }
}

/**
 * Creates a file with the provided buffer data at the specified path.
 * Writes the buffer as a base64-encoded file and logs the result.
 *
 * @param {string} baseDir - Directory path where the file will be created
 * @param {string} filename - Name of the file to create
 * @param {Buffer} resizedBuffer - Buffer containing the file data
 * @throws Will log and throw an error if file creation fails
 */
export function createFile(baseDir: string, filename: string, resizedBuffer: Buffer): void {
  const filePath = path.join(`${baseDir}`, `${filename}`);

  fs.writeFile(filePath, resizedBuffer.toString('base64'), 'base64', (err) => {
    if (err) {
      const handledError = handleError(err);
      Logger.error(handledError);
      throw err;
    }
    Logger.info(`${filename} written successfully`);
  });
}
