import { PromptResponse } from '../../models/schemas/prompt';
import OpenAI from 'openai';
import { z } from 'zod';

import { themes } from './themes';
import { styles } from './styles';

const openai = new OpenAI();

const prompts: z.infer<typeof PromptResponse>[] = [];

function getRandomElement(arr: { name: string; keywords: string[] }[]) {
  const index = Math.floor(Math.random() * arr.length);

  return arr[index];
}

export async function getDallEPrompts({
  theme,
  style,
  keywords,
  limit,
}: {
  theme?: string;
  style?: string;
  keywords?: string;
  limit: number;
}): Promise<z.infer<typeof PromptResponse>[]> {
  try {
    const promises = [];

    for (let i = 0; i < limit; i++) {
      const th = getRandomElement(themes);
      const st = getRandomElement(styles);

      const keywordsArr = [];

      if (keywords) {
        keywordsArr.push(...keywords.split(','));
      } else {
        keywordsArr.push(...th.keywords, ...st.keywords);
      }

      const prompt = `
		Create one DALL-E prompt to design a wide rectangular image with dimensions suitable for a desk mat (9450x4650) that fully utilizes the entire canvas without any gaps or blank spaces on the sides. The theme should revolve around ${theme || th.name}, and it should be inspired by the style of ${style || st.name}. Do not include the words "desk mat" in the prompt.
		
		Make sure to include the following instructions in the prompt:
		- Ensure the design fills the entire width and height of the canvas, fully occupying all available space with no borders, padding, or margins on the sides.
		- Ensure the design is vibrant but uses bright colors sparingly to enhance the overall theme and style. 
		- Fill the entire canvas with a cohesive and balanced composition, avoiding any blank or white spaces. 
		- Use intricate details and textures, to create a natural, flowing design. 
		- No text or borders should be present in the image, and ensure the design maintains visual appeal when scaled to the full size.
	   
	  	Additionally, generate an SEO-optimized Etsy description, a keyword-rich 140-character title, and a concise filename (without the format).
		The title should contain the following default text "Desk Mat XL Mouse Matt For Home And Office". Don't use any special characters or emojis.
	  	The description should contain the following default text after the SEO-optimized Etsy description. Ensure the description follows the below format:

		"Our desk mats are designed not just to look great, but to protect your workspace and brighten up your day. Made from a high-quality 100% polyester top and a durable natural rubber backing, they offer a smooth surface that’s perfect for both optical and laser mice. The anti-fray edges and non-slip base ensure your mat stays in place and stands up to everyday use.

		Available in three versatile sizes:
			- 14.4" × 12.1"
			- 23.6" × 13.8"
			- 31.5" × 15.5"

		Key features:
			- **Vibrant colours**: The latest printing techniques bring your favorite designs to life in bright, crisp detail.
			- **Non-slip rubber base**: Keeps the mat securely in place, providing a smooth and even surface for mouse movement.
			- **Smooth surface**: Offers effortless gliding and is easy to clean.
			- **Durable construction**: Polyester front and rubber back provide tear-resistant, long-lasting performance.

		As a small family business in the Cotswolds, we take pride in creating unique surface designs that add character and function to your space. These mats make great gifts or a stylish addition to any home or office setup."

    	Include the keywords ${keywordsArr}. Output the results in a JSON format. Structure the JSON as follows:
     	{
     	  "prompts": [
     		{
     		  "prompt": "Prompt 1",
     		  "description": "Description 1",
     		  "title": "Title 1",
			  "theme": "Theme 1",
			  "style": "Style 1",
     		  "filename": "Filename 1",
     		  "keywords": [],
     		},
     	  ]
     	}`;

      promises.push(
        openai.chat.completions
          .create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                name: 'User',
                content: prompt,
              },
            ],
            response_format: {
              type: 'json_object',
            },
          })
          .then((completion) => {
            const response = JSON.parse(
              completion.choices[0].message.content ?? '{}',
            );

            if (response.prompts) {
              prompts.push(...response.prompts);
            }
          }),
      );
    }

    await Promise.all(promises);

    return prompts;
  } catch (err) {
    throw err;
  }
}
