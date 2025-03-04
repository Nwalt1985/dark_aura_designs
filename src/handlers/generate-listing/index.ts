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

import dotenv from 'dotenv';

dotenv.config();

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

    process.exit(0);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    process.exit(1);
  }
})();

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
