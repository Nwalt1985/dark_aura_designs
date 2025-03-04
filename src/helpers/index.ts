/**
 * Helpers Module
 *
 * This module provides utility functions used throughout the application for various tasks:
 * - Date and number formatting
 * - Product configuration and details
 * - File system operations (creating, moving, and managing files)
 * - Database operations and cleanup
 * - Image processing and management
 *
 * The module centralizes common functionality to maintain consistency and reduce code duplication
 * across the application.
 */
import fs from 'fs';
import path from 'path';
import { PromptResponseType } from '../models/schemas/prompt';
import { deleteListingByFileName, getUnlisted } from '../service/db';
import {
  deskMatDefaultDescription,
  pillowDefaultDescription,
  blanketDefaultDescription,
  wovenBlanketDefaultDescription,
} from '../handlers/generate-images/defaultDescription';
import { Marketplace, Product, ProductName } from '../models/types/listing';
import { Logger, handleError } from '../errors';

/**
 * Returns the current date formatted as DD-MM-YYYY.
 *
 * @returns {string} The formatted date string
 */
export function getformattedDate(): string {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;

  return formattedDate;
}

/**
 * Generates a random number between 1000 and 9999.
 * Ensures the number is at least 4 digits by adding 1000 if necessary.
 *
 * @returns {number} A random 4-digit number
 */
export function generateRandomNumber(): number {
  let randomNumber = Math.floor(Math.random() * 10000);
  if (randomNumber < 1000) {
    randomNumber += 1000;
  }
  return randomNumber;
}

/**
 * Returns product configuration details based on product type and marketplace.
 *
 * This function provides all necessary configuration for a specific product type,
 * including file paths, dimensions, descriptions, and shop IDs.
 *
 * @param {ProductName} arg - The type of product to get details for
 * @param {Marketplace} marketplace - The marketplace (e.g., Etsy, Shopify)
 * @returns {Product} Complete product configuration object
 */
export function getProductDetails(arg: ProductName, marketplace: Marketplace): Product {
  const product: Product = {
    name:
      ProductName.DESK_MAT ||
      ProductName.PILLOW ||
      ProductName.BLANKET ||
      ProductName.WOVEN_BLANKET,
    title: '',
    dimensions: '',
    baseDir: '',
    defaultDescription: '',
    rescale: '',
    shopId: '',
    completedRescalePath: '',
  };

  switch (arg) {
    case ProductName.DESK_MAT:
      product.name = ProductName.DESK_MAT;
      product.title = 'Desk Mat XL Mouse Matt';
      product.dimensions = '9450x4650';
      product.baseDir = path.resolve(
        process.env['HOME'] || '',
        `/volumes/Shop Assets/${marketplace}/dark_aura_designs/desk_mats`, // Upload to NAS device
        // `Desktop/assets/${marketplace}/deskMats`,
      );
      product.defaultDescription = deskMatDefaultDescription;
      product.rescale = path.resolve(
        process.env['HOME'] || '',
        `Desktop/dark_aura_designs/rescale_desk_mats`,
      );
      product.completedRescalePath = path.resolve(
        process.env['HOME'] || '',
        `Desktop/dark_aura_designs/completed_desk_mats`,
      );
      product.shopId =
        marketplace === Marketplace.ETSY
          ? process.env['DARK_AURA_ETSY_SHOP_ID'] || ''
          : process.env['DARK_AURA_SHOPIFY_SHOP_ID'] || '';
      break;

    case ProductName.PILLOW:
      product.name = ProductName.PILLOW;
      product.title = 'Cushion';
      product.dimensions = '4050x4050';
      product.baseDir = path.resolve(
        process.env['HOME'] || '',
        `/volumes/Shop Assets/${marketplace}/dark_aura_designs/pillows`,
        // `Desktop/assets/${marketplace}/pillows`,
      );
      product.defaultDescription = pillowDefaultDescription;
      product.rescale = path.resolve(
        process.env['HOME'] || '',
        `Desktop/dark_aura_designs/rescale_pillows`,
      );
      product.completedRescalePath = path.resolve(
        process.env['HOME'] || '',
        `Desktop/dark_aura_designs/completed_pillows`,
      );
      product.shopId =
        marketplace === Marketplace.ETSY
          ? process.env['DARK_AURA_ETSY_SHOP_ID'] || ''
          : process.env['DARK_AURA_SHOPIFY_SHOP_ID'] || '';
      break;

    case ProductName.BLANKET:
      product.name = ProductName.BLANKET;
      product.title = 'Blanket';
      product.dimensions = '8228x6260';
      product.baseDir = path.resolve(
        process.env['HOME'] || '',
        `/volumes/Shop Assets/${marketplace}/dark_aura_designs/blankets`,
        // `Desktop/assets/${marketplace}/blankets`,
      );
      product.defaultDescription = blanketDefaultDescription;
      product.rescale = path.resolve(
        process.env['HOME'] || '',
        `Desktop/dark_aura_designs/rescale_blankets`,
      );
      product.completedRescalePath = path.resolve(
        process.env['HOME'] || '',
        `Desktop/dark_aura_designs/completed_blankets`,
      );
      product.shopId =
        marketplace === Marketplace.ETSY
          ? process.env['DARK_AURA_ETSY_SHOP_ID'] || ''
          : process.env['DARK_AURA_SHOPIFY_SHOP_ID'] || '';
      break;

    case ProductName.WOVEN_BLANKET:
      product.name = ProductName.WOVEN_BLANKET;
      product.title = 'Woven Blanket';
      product.dimensions = '7680x5760';
      product.baseDir = path.resolve(
        process.env['HOME'] || '',
        `/volumes/Shop Assets/${marketplace}/dark_aura_designs/woven_blankets`,
        // `Desktop/assets/${marketplace}/wovenBlankets`,
      );
      product.defaultDescription = wovenBlanketDefaultDescription;
      product.rescale = path.resolve(
        process.env['HOME'] || '',
        `Desktop/dark_aura_designs/rescale_woven_blankets`,
      );
      product.completedRescalePath = path.resolve(
        process.env['HOME'] || '',
        `Desktop/dark_aura_designs/completed_woven_blankets`,
      );
      product.shopId =
        marketplace === Marketplace.ETSY
          ? process.env['DARK_AURA_ETSY_SHOP_ID'] || ''
          : process.env['DARK_AURA_SHOPIFY_SHOP_ID'] || '';
      break;
  }

  return product;
}

/**
 * Retrieves filenames of generated product images from the specified directory.
 * Filters files based on product type and removes dimension information from filenames.
 *
 * @param {string} dir - Directory path to search for files
 * @param {ProductName} productType - Type of product to filter files for
 * @returns {string[]} Array of filtered filenames without dimension information
 */
export function getGeneratedFileNames(dir: string, productType: ProductName): string[] {
  const fileNameArray = assetFolder(dir);

  switch (productType) {
    case ProductName.DESK_MAT:
      return fileNameArray
        .filter((fileName) => fileName.includes('-9450x4650'))
        .map((fileName) => fileName.replace('-9450x4650', ''));

    case ProductName.PILLOW:
      return fileNameArray
        .filter((fileName) => fileName.includes('-4050x4050'))
        .map((fileName) => fileName.replace('-4050x4050', ''));

    case ProductName.BLANKET:
      return fileNameArray
        .filter((fileName) => fileName.includes('-8228x6260') || fileName.includes('-6260x8228'))
        .map((fileName) =>
          fileName.includes('-8228x6260')
            ? fileName.replace('-8228x6260', '')
            : fileName.replace('-6260x8228', ''),
        );

    case ProductName.WOVEN_BLANKET:
      return fileNameArray
        .filter((fileName) => fileName.includes('-7680x5760') || fileName.includes('-5760x7680'))
        .map((fileName) =>
          fileName.includes('-7680x5760')
            ? fileName.replace('-7680x5760', '')
            : fileName.replace('-5760x7680', ''),
        );
  }

  return [];
}

/**
 * Recursively scans a directory for image files in date-formatted subfolders.
 * Collects filenames from folders matching the date pattern (DD-MM-YYYY).
 * Skips hidden files and system files like .DS_Store.
 *
 * @param {string} directory - Root directory to scan
 * @returns {string[]} Array of filenames without file extensions
 * @private
 */
function assetFolder(directory: string): string[] {
  const fileArray: string[] = [];

  fs.readdirSync(directory).forEach((folder) => {
    if (folder.match(/\d{2}-\d{2}-\d{4}/)) {
      const folderPath = path.resolve(directory, folder);

      if (folderPath.includes('._')) {
        return;
      }

      fs.readdirSync(folderPath).forEach((file) => {
        if (file.includes('.DS_Store') || file.includes('._')) {
          return;
        }
        fileArray.push(file.replace('.jpg', ''));
      });
    }
  });

  return fileArray;
}

/**
 * Cleans up database listings that no longer have corresponding image files.
 * Compares database listings with actual files in the product directory and
 * removes any database entries that don't have matching files.
 *
 * @param {PromptResponseType[]} unlisted - Array of database listings to check
 * @param {Product} product - Product configuration object
 * @returns {Promise<PromptResponseType[]>} Updated array of unlisted items after cleanup
 */
export async function dbTidy(
  unlisted: PromptResponseType[],
  product: Product,
): Promise<PromptResponseType[]> {
  const unlistedFileNames = unlisted.map((listing) => {
    if (!listing.filename) {
      Logger.warn('No filename found for listing', listing);
    }
    return listing.filename.replace(/(-\d+x\d+)?$/, '');
  });

  const generatedImagesFilenames = getGeneratedFileNames(product.baseDir, product.name);

  for (const listing of unlistedFileNames) {
    if (!generatedImagesFilenames.includes(listing)) {
      Logger.info(`Deleting ${listing} from the DB`);
      await deleteListingByFileName(listing);
    }
  }

  return await getUnlisted(product.name);
}

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
 * Extracts a 6-digit image ID from a filename.
 * Uses regex to find a 6-digit number sequence in the filename.
 *
 * @param {string} filename - The filename to extract ID from
 * @returns {string | null} The extracted 6-digit ID or null if not found
 * @private
 */
function extractImageId(filename: string): string | null {
  const regex = /\b\d{6}\b/;
  const match = filename.match(regex);
  return match![0] || null;
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
