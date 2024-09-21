import { PromptResponse } from '../../models/schemas/prompt';
import OpenAI from 'openai';
import { z } from 'zod';

import { themes } from './themes';
import { styles } from './styles';

const openai = new OpenAI();

const prompts: z.infer<typeof PromptResponse> = [];

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
}): Promise<z.infer<typeof PromptResponse>> {
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

      const prompt = `Create one DALL-E prompt to generate an image for a desk mat design, centered around the theme of ${theme || th.name}, inspired by the style of ${style || st.name}.
	  	Do not include the words "desk mat" in the prompt.
	  	Use vibrant colors sparingly, aligning them with the theme and style. 
	  	Ensure the design fully occupies the canvas with no blank spaces, maintaining a cohesive and balanced composition. 
	  	Avoid white backgrounds, and exclude any text within the generated image. 
	  	Additionally, generate an SEO-optimized Etsy description, a keyword-rich 140-character title, and a concise filename (without the format).
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
