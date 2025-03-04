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

  if (product.name === ProductName.PILLOW) {
    const pillowCoverConfig = generateListingConfig(
      uploadedImagesArray,
      ProductName.PILLOW_COVER,
    );

    const pillowConfig = generateListingConfig(
      uploadedImagesArray,
      ProductName.PILLOW,
    );

    const pillowData = {
      title: unlisted.title,
      description: unlisted.description,
      blueprint_id: pillowConfig.blueprint_id,
      print_provider_id: pillowConfig.print_provider_id,
      tags: [],
      variants: pillowConfig.variants,
      print_areas: pillowConfig.print_areas,
    };

    const pillowCoverData = {
      title: `VARIATION ${unlisted.title.replace('Cushion', 'Cushion Cover')}`,
      description: unlisted.description,
      blueprint_id: pillowCoverConfig.blueprint_id,
      print_provider_id: pillowCoverConfig.print_provider_id,
      tags: [],
      variants: pillowCoverConfig.variants,
      print_areas: pillowCoverConfig.print_areas,
    };

    const promises = [
      createNewProduct(pillowData, product.shopId),
      createNewProduct(pillowCoverData, product.shopId),
    ];

    const [productResponse, productResponseCover] = await Promise.all(promises);

    if (productResponse.id) {
      await updateListing(unlisted.filename, ProductName.PILLOW, {
        listedAt: DateTime.now().toFormat('dd-MM-yyyy'),
        printifyProductId: productResponse.id,
      });
    } else {
      console.log('failed to create pillow product');
    }

    if (productResponseCover.id) {
      await updateListing(unlisted.filename, ProductName.PILLOW_COVER, {
        listedAt: DateTime.now().toFormat('dd-MM-yyyy'),
        printifyProductId: productResponseCover.id,
      });
    } else {
      console.log('failed to create pillow cover product');
    }

    console.log('uploaded product & variant');
  } else {
    const config = generateListingConfig(uploadedImagesArray, product.name);

    const data = {
      title: unlisted.title,
      description: unlisted.description,
      blueprint_id: config.blueprint_id,
      print_provider_id: config.print_provider_id,
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
}
