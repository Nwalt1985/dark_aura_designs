import { StatusCodes } from 'http-status-codes';
import { APIGatewayProxyResult } from 'aws-lambda';
import { PromptResponse } from '../../models/schemas/prompt';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI();

export const handler = async (): Promise<APIGatewayProxyResult> => {
  try {
    const prompt = `give me ten midjourney ai prompts to generate images suitable for a mug design with the concept being based around "Cat Mums". 
	Don't include the word mug in the prompt. Along with the prompt generate an etsy description, 140 character key word heavy title and 12 long tail key words. 
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

    const completion = await openai.chat.completions.create({
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
    });

    const response: z.infer<typeof PromptResponse> = JSON.parse(
      completion.choices[0].message.content ?? '{}',
    );

    PromptResponse.parse(response);

    return {
      statusCode: StatusCodes.OK,
      body: JSON.stringify(response, null, 2),
    };
  } catch (err) {
    let statusCode;
    let message;

    const error = err as Error;

    switch (error.name) {
      case 'ZodError':
        statusCode = StatusCodes.BAD_REQUEST;
        message = error.message;
        break;
      default:
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        message = error.message;
    }

    return {
      statusCode,
      body: JSON.stringify({ message, name: error.name }, null, 2),
    };
  }
};
