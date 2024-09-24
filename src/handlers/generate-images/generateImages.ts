import { z } from 'zod';
import { PromptResponse } from '../../models/schemas/prompt';
import { createDBListing } from '../../service/db';
import sharp from 'sharp';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI();

export async function generateDalleImages(
  prompts: z.infer<typeof PromptResponse>[],
  formattedDate: string,
) {
  try {
    console.log(`Generating ${prompts.length} images`);

    for (let index = 0; index < prompts.length; index++) {
      const { prompt, filename } = prompts[index];

      console.log(`Prompt: ${index}`);

      const baseDir = path.resolve(
        process.env.HOME || '',
        `Desktop/ai_etsy/etsy_assets/original/${formattedDate}/${index}`,
      );

      // Ensure the base directory exists
      if (!fs.existsSync(baseDir)) {
        console.log('Creating directory');
        fs.mkdirSync(baseDir, { recursive: true });
      }

      try {
        console.log(`Creating file: ${filename}`);

        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt,
          //   size: '1792x1024',
          quality: 'standard',
          response_format: 'b64_json',
        });

        const buffer = response.data[0].b64_json;

        // TODO: Create default parameters for the POD listing
        const dbData = {
          ...prompts[index],
          buffer: buffer || '',
        };

        // create DB entry
        await createDBListing([dbData]);

        // Resize images and create files
        if (buffer) {
          const mockup = await sharp(Buffer.from(buffer, 'base64'))
            .resize(2543, 1254)
            .jpeg()
            .toBuffer();

          await createFile(baseDir, `${filename}-mockup-2543x1254.jpg`, mockup);

          const image1 = await sharp(Buffer.from(buffer, 'base64'))
            .resize(4320, 3630)
            .jpeg()
            .toBuffer();

          await createFile(baseDir, `${filename}-4320x3630.jpg`, image1);

          const image2 = await sharp(Buffer.from(buffer, 'base64'))
            .resize(7080, 4140)
            .jpeg()
            .toBuffer();

          await createFile(baseDir, `${filename}-7080x4140.jpg`, image2);

          const image3 = await sharp(Buffer.from(buffer, 'base64'))
            .resize(9450, 4650)
            .jpeg()
            .toBuffer();

          await createFile(baseDir, `${filename}-9450x4650.jpg`, image3);
        }
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

async function createFile(
  baseDir: string,
  filename: string,
  resizedBuffer: Buffer,
) {
  const filePath = path.join(baseDir, `${filename}`);

  fs.writeFile(filePath, resizedBuffer.toString('base64'), 'base64', (err) => {
    if (err) {
      console.error(`Error writing file: ${err}`);
    } else {
      console.log(`${filename} written successfully.`);
    }
  });
}
