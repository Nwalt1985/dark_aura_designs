import { z } from 'zod';
import { PromptResponse } from '../../models/schemas/prompt';
import { dbTidy, getBuffer, getProductDetails } from '../../helpers';
import { getUnlisted, updateListing } from '../../service/db';
import {
  createNewProduct,
  getUploadedImages,
  uploadImages,
} from '../../service/printify';
import { PrintifyImageResponseType } from '../../models/schemas/printify';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import dotenv from 'dotenv';
import { generateListingConfig } from './listingConfig';
import { ProductName, Product, Marketplace } from '../../models/types/listing';
import { StatusCodes } from 'http-status-codes';
import { DateTime } from 'luxon';

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

(async () => {
  try {
    const argv = parser.parseSync();

    const product = getProductDetails(argv.product, argv.marketplace);

    const unlisted = await getUnlisted(product.name);

    if (!unlisted.length) {
      console.log('No unlisted listings to create');
      return;
    }
    const data = await dbTidy(unlisted, product);

    const limitedData = data.slice(0, argv.limit);

    const uploadedImages = await getUploadedImages();

    console.log(`Creating ${limitedData.length} Printify listings`);

    for (const item of limitedData) {
      await createPrintifyListingsData(item, uploadedImages, product);
    }

    return;
  } catch (err) {
    let statusCode;
    let message;

    const error = err as Error;

    switch (error.name) {
      case 'ZodError':
        statusCode = StatusCodes.BAD_REQUEST;
        message = error.message;
        break;
      default:
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        message = error.message;
    }

    console.error({ name: error.name, statusCode, message, error });
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
  const bufferArray = await getBuffer(unlisted.filename, product.baseDir);

  const uploadedImagesArray: {
    fileId: string | null;
    response: PrintifyImageResponseType;
  }[] = [];

  if (bufferArray.length) {
    for (const buffer of bufferArray) {
      if (buffer.filename.includes('mockup')) {
        console.log(`Skipping mockup image: ${buffer.filename}`);
        continue;
      }

      const uploadedImage = uploadedImages.imageData.find(
        (image) => image.file_name === buffer.filename,
      );

      if (!uploadedImage) {
        console.log(`Uploading image: ${buffer.filename}`);

        const uploaded = await uploadImages(buffer.base64, buffer.filename);
        uploadedImagesArray.push({
          response: uploaded,
          fileId: buffer.fileId,
        });
      } else {
        console.log(`Image already uploaded: ${buffer.filename}`);
        return;
      }
    }
  }

  const config = generateListingConfig(uploadedImagesArray, product.name);

  const data = {
    title: unlisted.title,
    description: unlisted.description,
    blueprint_id: config.blueprint_id,
    print_provider_id: config.print_provider_id,
    // tags: unlisted.keywords,
    tags: [],
    variants: config.variants,
    print_areas: config.print_areas,
  };

  const productResponse = await createNewProduct(data, product.shopId);

  await updateListing(unlisted.filename, product.name, {
    listedAt: DateTime.now().toFormat('dd-MM-yyyy'),
    printifyProductId: productResponse.id,
  });

  console.log('uploaded product');
}
