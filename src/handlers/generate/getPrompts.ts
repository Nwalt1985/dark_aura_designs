import { PromptResponse } from '../../models/schemas/prompt';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI();

const theme = [
  'psychedelic',
  'space',
  'nature',
  'fantasy',
  'sci-fi',
  'cyberpunk',
  'vaporwave',
  'retro',
  'futuristic',
  'abstract',
];

const style = [
  'minimalist',
  'surreal',
  'realistic',
  'cartoon',
  'anime',
  'pixel art',
  'watercolor',
  'oil painting',
  'pop art',
  'impressionist',
];

const prompts: z.infer<typeof PromptResponse> = [];

function getRandomElement(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function getDallEPrompts(): Promise<
  z.infer<typeof PromptResponse>
> {
  try {
    const promises = [];

    for (let i = 0; i < 10; i++) {
      const th = getRandomElement(theme);
      const st = getRandomElement(style);

      const prompt = `give me three DALL-E ai prompts to generate images suitable for a desk mat design with the concept theme being based around ${th}, in the style of ${st}. 
		Don't include the word 'desk mat' in the prompt. Do not have any repeats. Along with the prompt generate an SEO optimized etsy description, 140 character key word heavy title and 12 long tail key words. 
		Optimize the key words for better SEO. Output the results in a JSON format. Structure the JSON as follows: 
		{
		  "prompts": [
			{
			  "prompt": "Prompt 1",
			  "description": "Description 1",
			  "title": "Title 1",
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
