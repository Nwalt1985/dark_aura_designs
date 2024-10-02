import { PromptResponse } from '../../models/schemas/prompt';
import OpenAI from 'openai';
import { z } from 'zod';

import { themes } from './themes';
import { styles } from './styles';
import { genericKeywords } from './genericKeywords';

const openai = new OpenAI();

const prompts: z.infer<typeof PromptResponse>[] = [];

function getRandomElement(arr: { name: string; keywords: string[] }[]) {
  const index = Math.floor(Math.random() * arr.length);

  return arr[index];
}

function generateKeywordArray(keywords: string[]): string[] {
  const selectedKeywords = new Set<string>();

  while (selectedKeywords.size < 5) {
    const randomIndex = Math.floor(Math.random() * genericKeywords.length);
    selectedKeywords.add(genericKeywords[randomIndex]);
  }

  return keywords.concat(Array.from(selectedKeywords));
}

export async function getDallEPrompts({
  theme,
  style,
  keywords,
  limit,
  product,
}: {
  theme?: string;
  style?: string;
  keywords?: string;
  limit: number;
  product: {
    name: string;
    title: string;
    dimensions: string;
  };
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

      const keywordsWithGeneric = generateKeywordArray(keywordsArr);

      const prompt = `
		Create one DALL-E prompt to design a wide rectangular image with dimensions suitable for a ${product.name} (${product.dimensions}). The theme should revolve around ${theme || th.name}, and it should be inspired by the style of ${style || st.name}. Do not include the words ${product.name} in the prompt.
		
		Key points for the prompt:
		- Be specific. The prompt should ideally encompass various elements of the desired image. For instance, if you’re envisioning a landscape, describe not just the basic elements like trees and rivers, but also the type of trees, the state of the water (calm or turbulent), the time of day, the weather conditions, and the overall atmosphere you wish to capture.
	  	- use descriptive language to convey the mood, tone, and style you want to achieve. For example, if you’re aiming for a serene and tranquil image, mention the colors, lighting, and composition that would help create that effect.
	  	- Minimize ambiguity. Avoid vague or open-ended prompts that could lead to a wide range of interpretations. Instead, provide clear and detailed instructions to guide the AI in generating the desired image.
	  	- Keep the design fairly simple and uncluttered to ensure that it translates well to a physical product.

		Make sure to include the following instructions in the prompt:
		- Ensure the design fills the entire width and height of the canvas, fully occupying all available space with no borders, padding, or margins on the sides.
		- Ensure to use bright colors sparingly to enhance the overall theme and style. 
		- Fill the entire canvas with a cohesive and balanced composition, avoiding any blank or white spaces.  
		- No text or borders should be present in the image, and ensure the design maintains visual appeal when scaled to the full size.
	   
		Title: generate a keyword-rich 140-character title. The title should contain the following default text "${product.title} For Home And Office". Don't use any special characters or emojis.
		
		Filename: generate a concise filename without the format.
		
		Decription: SEO-optimized Etsy description.

    	Output the results in a JSON format. Structure the JSON as follows:
		
     	{
     	  "prompts": [
     		{
     		  "prompt": "Prompt 1",
			  productType: "${product.name}",
     		  "description": "Description 1",
     		  "title": "Title 1",
			  "theme": "Theme 1",
			  "style": "Style 1",
     		  "filename": "Filename 1",
     		  "keywords": [${keywordsWithGeneric}],
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
