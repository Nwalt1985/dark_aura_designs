import { z } from 'zod';
import { PromptResponse } from '../../models/schemas/prompt';
import { createDBListing } from '../../service/db';
import OpenAI from 'openai';
import fs from 'fs';
import {
  resizeDeskmats,
  resizeLaptopSleeve,
  resizeLunchBag,
  getformattedDate,
  removeRescaleImage,
} from '../../helpers';
import { Product } from '../../models/types/listing';
import { getImageData } from './queryWithOpenAi';
import path from 'path';

const openai = new OpenAI();

export async function generateDalleImages(
  prompts: z.infer<typeof PromptResponse>[],
  product: Product,
  formattedDate: string,
): Promise<void> {
  try {
    console.log(`Generating ${prompts.length} images`);

    for (let index = 0; index < prompts.length; index++) {
      const { prompt, filename, description } = prompts[index];

      // Ensure the base directory exists
      if (!fs.existsSync(product.baseDir)) {
        console.log('Creating directory');
        fs.mkdirSync(product.baseDir, { recursive: true });
      }

      try {
        console.log(`Creating file: ${filename}`);

        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt,
          quality: 'standard',
          response_format: 'b64_json',
        });

        const buffer = response.data[0].b64_json;

        const fileId = generateRandomNumber();

        const dbData = {
          ...prompts[index],
          productType: product.name,
          filename: `${filename}-${fileId}`,
          description: `${description}
		  ${product.defaultDescription}`,
          //   buffer: buffer || '',
        };

        // Resize images and create files
        if (buffer) {
          switch (product.name) {
            case 'desk mat':
              await resizeDeskmats(
                buffer,
                filename,
                fileId,
                product.baseDir,
                formattedDate,
              );
              break;
            case 'laptop sleeve':
              await resizeLaptopSleeve(
                buffer,
                filename,
                fileId,
                product.baseDir,
                formattedDate,
              );
              break;
            case 'lunch bag':
              await resizeLunchBag(
                buffer,
                filename,
                fileId,
                product.baseDir,
                formattedDate,
              );
          }
        }

        // create DB entry
        await createDBListing([dbData]);
      } catch (error) {
        console.error(`Error generating image for prompt ${index}:`, error);
      }

      // Delay to handle rate limit (5 requests per minute)
      if (index < prompts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 12000)); // 12 seconds delay
      }
    }
  } catch (error) {
    throw error;
  }
}

export async function generateImagesFromRescale(product: Product) {
  try {
    const formattedDate = getformattedDate();

    const baseDir = path.resolve(
      process.env.HOME || '',
      `Desktop/ai_etsy/etsy_assets/desk_mats/rescale`,
    );

    const outputDir = path.resolve(
      process.env.HOME || '',
      `Desktop/ai_etsy/etsy_assets/desk_mats`,
    );

    fs.readdirSync(baseDir).forEach(async (file) => {
      const fileId = generateRandomNumber();
      const filePath = path.join(baseDir, file);
      const buffer = fs.readFileSync(filePath);

      const imageData = await getImageData(buffer.toString('base64'));

      const fileName = file
        .replace('.png', '')
        .replace('.jpg', '')
        .toLowerCase();

      const dbData = {
        ...imageData,
        productType: product.name,
        filename: `${fileName}-${fileId}`,
        description: `${imageData.description}
			  ${product.defaultDescription}`,
      };

      await createDBListing([dbData]);

      await resizeDeskmats(
        buffer.toString('base64'),
        fileName,
        fileId,
        outputDir,
        formattedDate,
      );

      await removeRescaleImage(fileName);
    });
  } catch (error) {
    throw error;
  }
}

function generateRandomNumber(): number {
  let randomNumber = Math.floor(Math.random() * 10000);
  if (randomNumber < 1000) {
    randomNumber += 1000;
  }
  return randomNumber;
}
