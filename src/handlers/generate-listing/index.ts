/**
 * Listing Generation Module
 *
 * This module handles the creation of product listings on e-commerce platforms.
 * It processes unlisted products from the database, uploads their images to Printify,
 * and creates product listings with appropriate configurations based on product type.
 *
 * The module supports various product types including desk mats, pillows, blankets,
 * and woven blankets, with specialized handling for each product type.
 */
import { z } from 'zod';
import { PromptResponse } from '../../models/schemas/prompt';
import { dbTidy, getBuffer, getProductDetails } from '../../helpers';
import { getUnlisted, updateListing } from '../../service/db';
import { createNewProduct, getUploadedImages, uploadImages } from '../../service/printify';
import { PrintifyImageResponseType } from '../../models/schemas/printify';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { generateListingConfig } from './listingConfig';
import { ProductName, Product, Marketplace } from '../../models/types/listing';
import { DateTime } from 'luxon';
import { Logger, handleError, ExternalServiceError } from '../../errors';
import { closeConnection } from '../../database';

import dotenv from 'dotenv';

dotenv.config();

/**
 * Command-line argument parser configuration.
 * Defines the expected arguments and their types for the listing generation CLI.
 */
const parser = yargs(hideBin(process.argv))
  .options({
    product: {
      type: 'string',
      description: 'Product type for the listing',
      choices: Object.values(ProductName),
      demandOption: true,
    },
    marketplace: {
      type: 'string',
      description: 'Marketplace for the listing',
      choices: Object.values(Marketplace),
      demandOption: true,
    },
    limit: {
      type: 'number',
      description: 'Limit the number of prompts',
      default: 10,
    },
  })
  .strict()
  .help();

/**
 * Self-executing async function that serves as the entry point for the CLI.
 * Processes unlisted products, uploads images, and creates listings on Printify.
 * Handles errors and provides appropriate status codes and messages.
 */
void (async (): Promise<void> => {
  try {
    const argv = parser.parseSync();
    const product = getProductDetails(argv.product, argv.marketplace);
    const unlisted = await getUnlisted(product.name);

    if (!unlisted.length) {
      Logger.info('No unlisted listings to create');
      process.exit(0);
      return;
    }

    const data = await dbTidy(unlisted, product);
    const limitedData = data.slice(0, argv.limit);
    const uploadedImages = await getUploadedImages();

    Logger.info(`Creating ${limitedData.length} Printify listings`);

    for (const item of limitedData) {
      await createPrintifyListingsData(item, uploadedImages, product);
    }

    // Close the database connection before exiting
    await closeConnection();
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    await closeConnection();
  }
})();

/**
 * Creates product listings on Printify for a given unlisted product.
 * Handles image uploading, configuration generation, and product creation.
 *
 * This function:
 * 1. Retrieves image buffers for the product
 * 2. Uploads images to Printify if not already uploaded
 * 3. Generates appropriate product configurations based on product type
 * 4. Creates product listings on Printify
 * 5. Updates the database with listing information
 *
 * Special handling is included for pillow products, which create both pillow and pillow cover variants.
 *
 * @param {z.infer<typeof PromptResponse>} unlisted - The unlisted product data from the database
 * @param {Object} uploadedImages - Information about already uploaded images
 * @param {PrintifyImageResponseType[]} uploadedImages.imageData - Array of uploaded image data
 * @param {number} uploadedImages.length - Number of uploaded images
 * @param {number} uploadedImages.totalImages - Total number of images to upload
 * @param {Product} product - Product configuration object
 * @returns {Promise<void>} A promise that resolves when the listing is created
 * @throws Will log and rethrow errors that occur during processing
 */
export async function createPrintifyListingsData(
  unlisted: z.infer<typeof PromptResponse>,
  uploadedImages: {
    imageData: PrintifyImageResponseType[];
    length: number;
    totalImages: number;
  },
  product: Product,
): Promise<void> {
  let bufferArray;
  try {
    bufferArray = getBuffer(unlisted.filename, product.baseDir);
    const uploadedImagesArray: {
      fileId: string | null;
      response: PrintifyImageResponseType;
    }[] = [];

    if (bufferArray.length) {
      for (const buffer of bufferArray) {
        if (buffer.filename.includes('mockup')) {
          Logger.debug(`Skipping mockup image: ${buffer.filename}`);
          continue;
        }

        const uploadedImage = uploadedImages.imageData.find(
          (image) => image.file_name === buffer.filename,
        );

        if (!uploadedImage) {
          Logger.info(`Uploading image: ${buffer.filename}`);
          const uploaded = await uploadImages(buffer.base64, buffer.filename);
          uploadedImagesArray.push({
            response: uploaded,
            fileId: buffer.fileId,
          });
        } else {
          Logger.info(`Image already uploaded: ${buffer.filename}`);
          continue;
        }
      }
    }

    if (product.name === ProductName.PILLOW) {
      const pillowCoverConfig = generateListingConfig(
        uploadedImagesArray,
        ProductName.PILLOW_COVER,
      );
      const pillowConfig = generateListingConfig(uploadedImagesArray, ProductName.PILLOW);

      const pillowCoverTitle = 'VARIATION ' + unlisted.title.replace('Cushion', 'Cushion Cover');

      const [productResponse, productResponseCover] = await Promise.all([
        createNewProduct(
          {
            title: unlisted.title,
            description: unlisted.description,
            blueprint_id: pillowConfig.blueprint_id,
            print_provider_id: pillowConfig.print_provider_id,
            tags: [],
            variants: pillowConfig.variants,
            print_areas: pillowConfig.print_areas,
          },
          product.shopId,
        ),
        createNewProduct(
          {
            title: pillowCoverTitle,
            description: unlisted.description,
            blueprint_id: pillowCoverConfig.blueprint_id,
            print_provider_id: pillowCoverConfig.print_provider_id,
            tags: [],
            variants: pillowCoverConfig.variants,
            print_areas: pillowCoverConfig.print_areas,
          },
          product.shopId,
        ),
      ]);

      if (!productResponse.id) {
        throw new ExternalServiceError('Failed to create pillow product');
      }

      if (!productResponseCover.id) {
        throw new ExternalServiceError('Failed to create pillow cover product');
      }

      await updateListing(unlisted.filename, ProductName.PILLOW, {
        listedAt: DateTime.now().toFormat('dd-MM-yyyy'),
        printifyProductId: productResponse.id,
      });

      Logger.info('Uploaded product & variant');
      return;
    }

    const config = generateListingConfig(uploadedImagesArray, product.name);
    const productResponse = await createNewProduct(
      {
        title: unlisted.title,
        description: unlisted.description,
        blueprint_id: config.blueprint_id,
        print_provider_id: config.print_provider_id,
        tags: [],
        variants: config.variants,
        print_areas: config.print_areas,
      },
      product.shopId,
    );

    if (!productResponse.id) {
      throw new ExternalServiceError('Failed to create product');
    }

    await updateListing(unlisted.filename, product.name, {
      listedAt: DateTime.now().toFormat('dd-MM-yyyy'),
      printifyProductId: productResponse.id,
    });

    Logger.info('Uploaded product');
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw error;
  }
}
