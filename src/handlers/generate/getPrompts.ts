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

export async function getDallEPrompts(): Promise<
  z.infer<typeof PromptResponse>
> {
  try {
    const promises = [];

    for (let i = 0; i < 1; i++) {
      const th = getRandomElement(themes);
      const st = getRandomElement(styles);

      const prompt = `give me one DALL-E ai prompt to generate an image suitable for a desk mat design with the concept theme being based around ${th.name}, in the style of ${st.name}.
     	Don't include the word 'desk mat' in the prompt. Do not have any repeats. Along with the prompt generate an SEO optimized etsy description, 140 character key word heavy title, including the default keywords '${th.keywords},${st.keywords}' and a short filename, dont include the filename format.
     	Optimize the key words for better SEO. Output the results in a JSON format. Structure the JSON as follows:
     	{
     	  "prompts": [
     		{
     		  "prompt": "Prompt 1",
     		  "description": "Description 1",
     		  "title": "Title 1",
     		  "filename": "Filename 1",
     		  "keywords": ["Keyword 1", "Keyword 2"]
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

    PromptResponse.parse(prompts);

    return prompts;
  } catch (err) {
    throw err;
  }
}
