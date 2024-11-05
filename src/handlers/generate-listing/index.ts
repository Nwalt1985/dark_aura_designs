import { z } from 'zod';
import { PromptResponse } from '../../models/schemas/prompt';
import {
  dbTidy,
  getBuffer,
  getformattedDate,
  getProductDetails,
} from '../../helpers';
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
import { BuildProductType, Product } from '../../models/types/listing';

dotenv.config();

const parser = yargs(hideBin(process.argv))
  .options({
    product: {
      type: 'string',
      description: 'Product type for the listing',
      demandOption: true,
      choices: Object.values(BuildProductType),
    },
    limit: {
      type: 'number',
      description: 'Limit the number of prompts',
      default: 5,
    },
  })
  .strict()
  .help();

(async () => {
  try {
    const argv = parser.parseSync();
    const product = getProductDetails(argv.product);
    const unlisted = await getUnlisted(product.name);

    if (!unlisted.length) {
      console.log('No unlisted listings to create');
      return;
    }
    const data = await dbTidy(unlisted, product);

    const uploadedImages = await getUploadedImages();

    console.log(
      `${product.name} - Creating ${argv.limit || data.length} Printify listings`,
    );

    for (let i = 0; i < argv.limit; i++) {
      await createPrintifyListingsData(data[i], uploadedImages, product);
    }

    return;
  } catch (error) {
    console.error(error);
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
  try {
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
      tags: unlisted.keywords,
      variants: config.variants,
      print_areas: config.print_areas,
    };

    await createNewProduct(data);

    await updateListing(unlisted.filename, product.name);
  } catch (error) {
    throw error;
  }
}
