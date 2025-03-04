/**
 * Image Processing Module
 *
 * This module re-exports image processing functions from specialized modules:
 * - common: Common image processing utilities
 * - deskMats: Desk mat specific processing
 * - pillows: Pillow specific processing
 * - blankets: Blanket specific processing
 * - wovenBlankets: Woven blanket specific processing
 *
 * This centralized export approach maintains backward compatibility while
 * improving code organization and maintainability.
 */

// Re-export from common
export { validateAndCreateDirectory, processImage, createDateDirectory } from './common';

// Re-export from deskMats
export { resizeDeskmats } from './deskMats';

// Re-export from pillows
export { resizePillowImage } from './pillows';

// Re-export from blankets
export { resizeBlanketImage } from './blankets';

// Re-export from wovenBlankets
export { resizeWovenBlanketImage } from './wovenBlankets';
