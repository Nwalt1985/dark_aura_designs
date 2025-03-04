/**
 * Image Generation Handler Module
 *
 * This module handles the process of generating product images and their associated metadata.
 * It coordinates the workflow for processing images:
 *
 * 1. Analyzing images using AI to generate metadata (titles, descriptions, keywords)
 * 2. Validating the generated metadata
 * 3. Storing the metadata in the database
 * 4. Processing images to create various sizes and formats for different marketplaces
 * 5. Managing the file system operations for processed images
 *
 * The module supports different product types and handles their specific processing requirements.
 */
import { createDBListing } from '../../service/db';
import fs from 'fs';
import {
  resizeDeskmats,
  resizePillowImage,
  resizeBlanketImage,
  resizeWovenBlanketImage,
} from '../../helpers/rescaleImages';
import { Product, ProductName } from '../../models/types/listing';
import { getImageData } from './queryWithOpenAi';
import path from 'path';
import { getformattedDate, relocateRescaleImage } from '../../helpers';
import { ProductData } from '../../models/schemas/db';
import { Logger, handleError, ValidationError } from '../../errors';

/**
 * Validates image data to ensure all required fields are present and valid.
 * Provides default values for optional fields if they are missing.
 *
 * @param {Partial<ProductData>} imageData - Partial product data to validate
 * @param {string} fileName - Name of the file being processed (for error messages)
 * @returns {ProductData} Complete and validated product data
 * @throws {ValidationError} If required fields are missing or invalid
 */
function validateImageData(imageData: Partial<ProductData>, fileName: string): ProductData {
  if (!imageData) {
    throw new ValidationError(`Image data is missing for file: ${fileName}`);
  }

  if (!imageData.title) {
    throw new ValidationError(`Title is missing for file: ${fileName}`);
  }

  if (imageData.title.length > 140) {
    throw new ValidationError(`Title is too long for file: ${fileName}`);
  }

  // Ensure other required fields have at least default values
  return {
    prompt: imageData.prompt || '',
    title: imageData.title,
    description: imageData.description || '',
    keywords: imageData.keywords || [],
    theme: imageData.theme || '',
    style: imageData.style || '',
    // Include any other required fields from ProductData with defaults
    ...imageData,
  } as ProductData;
}

// Define the type for the image processor function
type ImageProcessor = (
  buffer: Buffer,
  filename: string,
  fileId: number,
  baseDir: string,
  formattedDate: string,
) => Promise<void>;

// Map of product types to their respective image processing functions
const productImageProcessors: Record<ProductName, ImageProcessor> = {
  [ProductName.DESK_MAT]: resizeDeskmats,
  [ProductName.PILLOW]: resizePillowImage,
  [ProductName.BLANKET]: resizeBlanketImage,
  [ProductName.WOVEN_BLANKET]: resizeWovenBlanketImage,
  [ProductName.PILLOW_COVER]: resizePillowImage, // Pillow cover uses the same processor as pillow
};

/**
 * Processes an image file by generating metadata, storing in database, and creating resized versions.
 *
 * This function handles the complete workflow for processing an image:
 * 1. Reads the image file
 * 2. Generates metadata using AI
 * 3. Validates the metadata
 * 4. Stores the metadata in the database
 * 5. Processes the image to create resized versions
 * 6. Moves the original file to the completed directory
 *
 * @param {string} filePath - Path to the image file
 * @param {string} fileName - Name of the file without extension
 * @param {number} fileId - Unique identifier for the file
 * @param {Product} product - Product configuration object
 * @param {string} formattedDate - Formatted date string for directory organization
 * @returns {Promise<void>} A promise that resolves when processing is complete
 * @throws Will log and rethrow errors that occur during processing
 */
async function processImageFile(
  filePath: string,
  fileName: string,
  fileId: number,
  product: Product,
  formattedDate: string,
): Promise<void> {
  try {
    const buffer = fs.readFileSync(filePath);
    const partialImageData = (await getImageData(buffer, product.name)) as Partial<ProductData>;

    // Validate and get complete image data with all required fields
    const imageData = validateImageData(partialImageData, fileName);

    const dbData = {
      prompt: imageData.prompt,
      productType: product.name,
      description: `${imageData.description}
        ${product.defaultDescription}`,
      title: imageData.title,
      keywords: imageData.keywords,
      theme: imageData.theme,
      style: imageData.style,
      filename: `${fileName}-${fileId}`,
      createdAt: new Date().toISOString(),
    };

    await createDBListing([dbData]);

    const processImage = productImageProcessors[product.name];

    if (!processImage) {
      throw new ValidationError(`Unsupported product type: ${product.name}`);
    }

    await processImage(buffer, fileName, fileId, product.baseDir, formattedDate);

    relocateRescaleImage(product, fileName);
    Logger.info(`Successfully processed image: ${fileName}`);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw error;
  }
}

/**
 * Processes multiple image files from a rescale directory to generate product listings.
 *
 * This function:
 * 1. Reads image files from the product's rescale directory
 * 2. Processes each file up to the specified limit
 * 3. Generates a unique ID for each file
 * 4. Delegates processing to the processImageFile function
 * 5. Handles errors for individual files without stopping the entire batch
 *
 * @param {Product} product - Product configuration object
 * @param {number} limit - Maximum number of files to process
 * @returns {Promise<void>} A promise that resolves when all files have been processed
 * @throws Will log and rethrow errors that occur during processing
 */
export async function generateImagesFromRescale(product: Product, limit: number): Promise<void> {
  const formattedDate = getformattedDate();
  const rescaleDir = product.rescale;

  try {
    if (!fs.existsSync(rescaleDir)) {
      throw new ValidationError(`Rescale directory does not exist: ${rescaleDir}`);
    }

    const files = fs.readdirSync(rescaleDir).filter((file) => !file.startsWith('.'));
    const processLimit = Math.min(limit, files.length);

    Logger.info(`Processing ${processLimit} files from ${rescaleDir}`);

    for (let i = 0; i < processLimit; i++) {
      const file = files[i];
      if (!file) continue;

      const fileId = Math.floor(Math.random() * 9000) + 1000;
      const filePath = path.join(rescaleDir, file);
      const fileName = file.replace(/\.(png|jpg)$/, '').toLowerCase();

      try {
        await processImageFile(filePath, fileName, fileId, product, formattedDate);
      } catch (error: unknown) {
        const handledError = handleError(error);
        Logger.error(handledError);
        Logger.warn(`Skipping file due to error: ${file}`);
        continue;
      }
    }

    Logger.info(`Completed processing ${processLimit} files`);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw error;
  }
}
