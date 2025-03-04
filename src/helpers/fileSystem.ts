/**
 * File System Utilities Module
 *
 * This module provides utility functions for file system operations.
 */
import fs from 'fs';
import path from 'path';
import { Product } from '../models/types/listing';
import { Logger, handleError, ValidationError } from '../errors';
import { extractImageId } from './dateUtils';

/**
 * Validates if a path exists and is accessible
 *
 * @param {string} pathToCheck - Path to validate
 * @param {boolean} isDirectory - Whether the path should be a directory
 * @returns {boolean} True if path exists and is accessible
 */
function validatePath(pathToCheck: string, isDirectory: boolean = true): boolean {
  try {
    const stats = fs.statSync(pathToCheck);
    return isDirectory ? stats.isDirectory() : stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Safely creates a directory if it doesn't exist
 *
 * @param {string} dirPath - Directory path to create
 * @throws {ValidationError} If directory creation fails
 */
function ensureDirectoryExists(dirPath: string): void {
  try {
    if (!validatePath(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      Logger.info(`Created directory: ${dirPath}`);
    }
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError(`Failed to create directory: ${dirPath}`, error);
  }
}

/**
 * Retrieves image buffers from date-formatted subfolders matching a specific filename.
 * Searches through date-formatted directories (DD-MM-YYYY) for files containing the specified filename.
 *
 * @param {string} fileName - Partial filename to search for
 * @param {string} baseDir - Base directory to search in
 * @returns {Array<{filename: string, fileId: string | null, base64: Buffer}>} Array of objects containing filename, fileId, and image buffer
 * @throws {ValidationError} If the base directory doesn't exist or is inaccessible
 */
export function getBuffer(
  fileName: string,
  baseDir: string,
): {
  filename: string;
  fileId: string | null;
  base64: Buffer;
}[] {
  if (!validatePath(baseDir)) {
    throw new ValidationError(`Base directory does not exist or is not accessible: ${baseDir}`);
  }

  const buffer: {
    filename: string;
    fileId: string | null;
    base64: Buffer;
  }[] = [];

  try {
    const dirs = fs.readdirSync(baseDir);

    for (const dir of dirs) {
      if (dir.includes('.DS_Store') || dir.includes('._')) {
        continue;
      }

      if (dir.match(/\d{2}-\d{2}-\d{4}/)) {
        const folder = path.resolve(baseDir, dir);

        if (!validatePath(folder)) {
          Logger.warn(`Skipping inaccessible directory: ${folder}`);
          continue;
        }

        const files = fs.readdirSync(folder);

        for (const file of files) {
          if (file.includes('.DS_Store') || file.includes('._')) {
            continue;
          }

          if (file.includes(fileName)) {
            const filePath = path.resolve(folder, file);

            if (!validatePath(filePath, false)) {
              Logger.warn(`Skipping inaccessible file: ${filePath}`);
              continue;
            }

            try {
              buffer.push({
                filename: file,
                fileId: extractImageId(file),
                base64: fs.readFileSync(filePath),
              });
            } catch (readError: unknown) {
              const handledError = handleError(readError);
              Logger.error(handledError);
              Logger.warn(`Failed to read file: ${filePath}`);
            }
          }
        }
      }
    }

    return buffer;
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError(`Failed to read from directory: ${baseDir}`, error);
  }
}

/**
 * Moves processed image files from the rescale directory to the completed directory.
 * Handles both .png and .jpg file extensions and creates the completed directory if needed.
 *
 * @param {Product} product - Product configuration object containing directory paths
 * @param {string} fileName - Base filename without extension
 * @throws {ValidationError} If file operations fail
 */
export function relocateRescaleImage(product: Product, fileName: string): void {
  try {
    const rescaleDir = product.rescale;
    const completedDir = product.completedRescalePath;

    if (!validatePath(rescaleDir)) {
      throw new ValidationError(
        `Rescale directory does not exist or is not accessible: ${rescaleDir}`,
      );
    }

    // Create completed_rescale directory if it doesn't exist
    ensureDirectoryExists(completedDir);

    const fileExtensions = ['.png', '.jpg'];
    let filesMoved = false;

    for (const extension of fileExtensions) {
      const sourceFile = path.resolve(rescaleDir, `${fileName}${extension}`);
      const targetFile = path.resolve(completedDir, `${fileName}${extension}`);

      if (fs.existsSync(sourceFile)) {
        // Check if target file already exists
        if (fs.existsSync(targetFile)) {
          const backupFile = path.resolve(
            completedDir,
            `${fileName}_backup_${Date.now()}${extension}`,
          );
          Logger.warn(`Target file already exists, creating backup: ${backupFile}`);
          fs.renameSync(targetFile, backupFile);
        }

        fs.renameSync(sourceFile, targetFile);
        Logger.info(`Moved ${fileName}${extension} to completed_rescale directory`);
        filesMoved = true;
      }
    }

    if (!filesMoved) {
      Logger.warn(`No files found to move for ${fileName}`);
    }
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError(`Failed to relocate image: ${fileName}`, error);
  }
}

/**
 * Creates a file with the provided buffer data at the specified path.
 * Writes the buffer as a base64-encoded file and logs the result.
 *
 * @param {string} baseDir - Directory path where the file will be created
 * @param {string} filename - Name of the file to create
 * @param {Buffer} resizedBuffer - Buffer containing the file data
 * @returns {Promise<void>} Promise that resolves when the file is written
 * @throws {ValidationError} If file creation fails
 */
export async function createFile(
  baseDir: string,
  filename: string,
  resizedBuffer: Buffer,
): Promise<void> {
  const filePath = path.join(`${baseDir}`, `${filename}`);

  // Ensure the directory exists
  ensureDirectoryExists(baseDir);

  try {
    // Convert Buffer to Uint8Array which is compatible with fs.promises.writeFile
    const uint8Array = new Uint8Array(resizedBuffer);
    await fs.promises.writeFile(filePath, uint8Array);
    Logger.info(`${filename} written successfully`);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError(`Failed to write file: ${filename}`, error);
  }
}
