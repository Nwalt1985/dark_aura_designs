import { z } from 'zod';
import { PromptResponse } from '../../models/schemas/prompt';
import { dbTidy, getBuffer } from '../../helpers';
import { getAllListings, getUnlisted, updateListing } from '../../service/db';
import {
  createNewProduct,
  getUploadedImages,
  uploadImages,
} from '../../service/printify';
import { PrintifyImageResponseType } from '../../models/schemas/printify';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import dotenv from 'dotenv';

dotenv.config();

const parser = yargs(hideBin(process.argv))
  .options({
    limit: {
      type: 'number',
      description: 'Limit the number of prompts',
      default: 5,
    },
  })
  .strict() // Ensure that invalid options throw an error
  .help();

(async () => {
  try {
    const argv = parser.parseSync();

    const totalListings = await getAllListings();
    console.log('Total Listings:', totalListings.length);

    const unlisted = await getUnlisted();

    if (!unlisted.length) {
      console.log('No unlisted listings to create');
      return;
    }
    const data = await dbTidy(unlisted);

    const uploadedImages = await getUploadedImages();

    console.log('Total Unlisted:', data.length);

    console.log(`Creating ${argv.limit} Printify listings`);

    for (let i = 0; i < argv.limit; i++) {
      await createPrintifyListingsData(data[i], uploadedImages);
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
) {
  try {
    const bufferArray = await getBuffer(unlisted.filename);

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

    const variants = [
      {
        id: 81075,
        sku: '21734943883745480231',
        price: 3190,
        is_enabled: true,
        is_default: false,
      },
      {
        id: 103806,
        sku: '74676489247340010998',
        price: 1645,
        is_enabled: true,
        is_default: false,
      },
      {
        id: 103807,
        sku: '82680705350038580718',
        price: 2410,
        is_enabled: true,
        is_default: true,
      },
    ];

    const data = {
      title: unlisted.title,
      description: unlisted.description,
      blueprint_id: Number(process.env.PRINTIFY_BLUEPRINT_ID) || 0,
      print_provider_id: Number(process.env.PRINT_PROVIDER_ID) || 0,
      tags: unlisted.keywords,
      variants,
      print_areas: [
        {
          variant_ids: [81075],
          placeholders: [
            {
              position: 'front',
              images: [
                {
                  id: uploadedImagesArray.find((image) => {
                    const file = `${unlisted.filename}-9450x4650.jpg`;

                    return image.response.file_name === file;
                  })!.response.id,
                  x: 0.5,
                  y: 0.5,
                  scale: 1,
                  angle: 0,
                },
              ],
            },
          ],
          background: '#ffffff',
        },
        {
          variant_ids: [103806],
          placeholders: [
            {
              position: 'front',
              images: [
                {
                  id: uploadedImagesArray.find((image) => {
                    const file = `${unlisted.filename}-4320x3630.jpg`;

                    return image.response.file_name === file;
                  })!.response.id,
                  x: 0.5,
                  y: 0.5,
                  scale: 1,
                  angle: 0,
                },
              ],
            },
          ],
          background: '#ffffff',
        },
        {
          variant_ids: [103807],
          placeholders: [
            {
              position: 'front',
              images: [
                {
                  id: uploadedImagesArray.find((image) => {
                    const file = `${unlisted.filename}-7080x4140.jpg`;

                    return image.response.file_name === file;
                  })!.response.id,
                  x: 0.5,
                  y: 0.5,
                  scale: 1,
                  angle: 0,
                },
              ],
            },
          ],
          background: '#ffffff',
        },
      ],
    };

    await createNewProduct(data);

    await updateListing(unlisted.filename);
  } catch (error) {
    throw error;
  }
}
