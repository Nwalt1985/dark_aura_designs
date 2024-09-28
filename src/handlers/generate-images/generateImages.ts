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
      const { prompt, filename, description } = prompts[index];

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
          quality: 'standard',
          response_format: 'b64_json',
        });

        const buffer = response.data[0].b64_json;

        const fileId = generateRandomNumber();

        const dbData = {
          ...prompts[index],
          filename: `${filename}-${fileId}`,
          description: `${description}
		  
		Our desk mats are designed not just to look great, but to protect your workspace and brighten up your day. Made from a high-quality 100% polyester top and a durable natural rubber backing, they offer a smooth surface that’s perfect for both optical and laser mice. The anti-fray edges and non-slip base ensure your mat stays in place and stands up to everyday use.

		Available in three versatile sizes:
			- 14.4" × 12.1"
			- 23.6" × 13.8"
			- 31.5" × 15.5"

		Key features:
			- **Vibrant colours**: The latest printing techniques bring your favorite designs to life in bright, crisp detail.
			- **Non-slip rubber base**: Keeps the mat securely in place, providing a smooth and even surface for mouse movement.
			- **Smooth surface**: Offers effortless gliding and is easy to clean.
			- **Durable construction**: Polyester front and rubber back provide tear-resistant, long-lasting performance.

		As a small family business in the Cotswolds, we take pride in creating unique surface designs that add character and function to your space. These mats make great gifts or a stylish addition to any home or office setup.`,
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

          await createFile(
            baseDir,
            `${filename}-${fileId}-mockup-2543x1254.jpg`,
            mockup,
          );

          const image1 = await sharp(Buffer.from(buffer, 'base64'))
            .resize(4320, 3630)
            .jpeg()
            .toBuffer();

          await createFile(
            baseDir,
            `${filename}-${fileId}-4320x3630.jpg`,
            image1,
          );

          const image2 = await sharp(Buffer.from(buffer, 'base64'))
            .resize(7080, 4140)
            .jpeg()
            .toBuffer();

          await createFile(
            baseDir,
            `${filename}-${fileId}-7080x4140.jpg`,
            image2,
          );

          const image3 = await sharp(Buffer.from(buffer, 'base64'))
            .resize(9450, 4650)
            .jpeg()
            .toBuffer();

          await createFile(
            baseDir,
            `${filename}-${fileId}-9450x4650.jpg`,
            image3,
          );
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

function generateRandomNumber(): number {
  let randomNumber = Math.floor(Math.random() * 10000);
  if (randomNumber < 1000) {
    randomNumber += 1000;
  }
  return randomNumber;
}
