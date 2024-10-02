import { z } from 'zod';
import { PromptResponse } from '../../models/schemas/prompt';
import { createDBListing } from '../../service/db';
import sharp from 'sharp';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { resizeDeskmats, resizeLaptopSleeve } from '../../helpers';

const openai = new OpenAI();

export async function generateDalleImages(
  prompts: z.infer<typeof PromptResponse>[],
  product: {
    name: string;
    title: string;
    dimensions: string;
    baseDir: string;
    defaultDescription: string;
  },
  formattedDate: string,
) {
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
          buffer: buffer || '',
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

function generateRandomNumber(): number {
  let randomNumber = Math.floor(Math.random() * 10000);
  if (randomNumber < 1000) {
    randomNumber += 1000;
  }
  return randomNumber;
}
