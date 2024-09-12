import { z } from 'zod';
import { PromptResponse } from '../../models/schemas/prompt';
import OpenAI from 'openai';
import fs from 'fs';

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

    // const promises = [];
    let count = 0;

    // for (let prompt in prompts) {
    // count++;

    // promises.push(
    await openai.images
      .generate({
        model: 'dall-e-3',
        prompt: prompts[0].prompt,
        size: '1792x1024',
        quality: 'hd',
        response_format: 'b64_json',
      })
      .then((response) => {
        console.log('Uploading image');

        const buffer = response.data[0].b64_json;

        if (buffer) {
          fs.writeFileSync(
            `~/shared/etsy_images/original/${formattedDate}-${count}.png`,
            buffer,
            'base64',
          );
        }
      });
    // );
    // }
    // await Promise.all(promises);
    return;
  } catch (err) {
    throw err;
  }
}
