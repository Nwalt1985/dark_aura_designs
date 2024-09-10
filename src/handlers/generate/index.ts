import { StatusCodes } from 'http-status-codes';
import { APIGatewayProxyResult } from 'aws-lambda';
import OpenAI from 'openai';

const openai = new OpenAI();

export const handler = async (): Promise<APIGatewayProxyResult> => {
  try {
    const prompt = `give me ten midjourney ai prompts to generate images suitable for a mug design with the concept being based around "Cat Mums". 
	Don't include the word mug in the prompt. Along with the prompt generate an etsy description, 140 character key word heavy title and 12 long tail key words. 
	Optimize the key words for better SEO. Output the results in a JSON format.`;

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

    return {
      statusCode: StatusCodes.OK,
      body: JSON.stringify(prompt, null, 2),
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
