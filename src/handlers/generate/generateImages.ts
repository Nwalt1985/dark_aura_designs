import { set, z } from 'zod';
import { PromptResponse } from '../../models/schemas/prompt';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI();

export async function generateDalleImages(
  prompts: z.infer<typeof PromptResponse>,
) {
  try {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();

    const formattedDate = `${day}-${month}-${year}`;
    const baseDir = path.resolve(
      process.env.HOME || '',
      `Documents/etsy_images/original/${formattedDate}`,
    );

    // Ensure the base directory exists
    if (!fs.existsSync(baseDir)) {
      console.log('Creating directory');
      fs.mkdirSync(baseDir, { recursive: true });
    }

    for (let index = 0; index < prompts.length; index++) {
      const { prompt } = prompts[index];

      try {
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt,
          size: '1792x1024',
          quality: 'hd',
          response_format: 'b64_json',
        });

        console.log('Uploading image');

        const buffer = response.data[0].b64_json;

        if (buffer) {
          const filePath = path.join(baseDir, `${index}.png`);
          fs.writeFile(filePath, buffer, 'base64', (err) => {
            if (err) {
              console.error(`Error writing file: ${err}`);
            } else {
              console.log('File written successfully.');
            }
          });
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
    console.error('Error in generateDalleImages:', error);
  }
}
