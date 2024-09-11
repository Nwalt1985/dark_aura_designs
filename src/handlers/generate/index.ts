import { StatusCodes } from 'http-status-codes';
import { APIGatewayProxyResult } from 'aws-lambda';

import { getDallEPrompts } from './getPrompts';

export const handler = async (): Promise<APIGatewayProxyResult> => {
  try {
    const dallEPrompts = await getDallEPrompts();

    return {
      statusCode: StatusCodes.OK,
      body: JSON.stringify(dallEPrompts, null, 2),
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
