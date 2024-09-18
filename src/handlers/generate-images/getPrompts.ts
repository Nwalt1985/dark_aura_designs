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

      const prompt = `give me one DALL-E ai prompt to generate an image suitable for a desk mat design with the concept theme being based around ${th.name}, in the style of ${st.name}.
     	Don't include the word 'desk mat' in the prompt and also don't include any generated text in the image. Along with the prompt generate an SEO optimized etsy description, 140 character key word heavy title, and a short filename, dont include the filename format.
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
