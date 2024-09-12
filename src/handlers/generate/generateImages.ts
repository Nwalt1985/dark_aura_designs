import { z } from 'zod';
import { PromptResponse } from '../../models/schemas/prompt';
import OpenAI from 'openai';
import fs from 'fs';
import { Writable } from 'stream';

const openai = new OpenAI();

export async function generateDalleImages(
  prompts: z.infer<typeof PromptResponse>,
) {
  try {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();

    const formattedDate = `${day}/${month}/${year}`;

    const promises = prompts.map(async ({ prompt }, index) => {
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
          const bufferStream = new Writable();
		  
          bufferStream._write = (chunk, encoding, done) => {
            fs.writeFile(
              `~/shared/etsy_images/original/${formattedDate}-${index}.png`,
              chunk,
              'base64',
              (err) => {
                if (err) {
                  console.error(`Error writing file: ${err}`);
                } else {
                  console.log('File written successfully.');
                }
                done();
              },
            );
          };

          bufferStream.write(buffer);
          bufferStream.end();
        }
      } catch (error) {
        console.error(`Error generating image for prompt ${index}:`, error);
      }
    });

    await Promise.all(promises);

    return;
  } catch (err) {
    throw err;
  }
}
