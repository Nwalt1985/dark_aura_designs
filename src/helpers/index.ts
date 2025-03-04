/**
 * Helpers Module
 *
 * This module re-exports utility functions from specialized modules:
 * - dateUtils: Date and number formatting utilities
 * - productConfig: Product configuration and details
 * - fileSystem: File system operations
 * - databaseUtils: Database operations and cleanup
 * - imageProcessing: Image processing and resizing
 *
 * This centralized export approach maintains backward compatibility while
 * improving code organization and maintainability.
 */

// Re-export from dateUtils
export { getformattedDate, generateRandomNumber, extractImageId } from './dateUtils';

// Re-export from productConfig
export { getProductDetails, getGeneratedFileNames } from './productConfig';

// Re-export from fileSystem
export { getBuffer, relocateRescaleImage, createFile } from './fileSystem';

// Re-export from databaseUtils
export { dbTidy } from './databaseUtils';

// Re-export from imageProcessing
export {
  resizeDeskmats,
  resizePillowImage,
  resizeBlanketImage,
  resizeWovenBlanketImage,
  validateAndCreateDirectory,
  processImage,
  createDateDirectory,
} from './imageProcessing';
