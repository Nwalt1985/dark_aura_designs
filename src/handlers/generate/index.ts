import { StatusCodes } from 'http-status-codes';
import { APIGatewayProxyResult } from 'aws-lambda';

import { getDallEPrompts } from './getPrompts';
import { generateDalleImages } from './generateImages';
import cron from 'node-cron';

// Run locally
// cron.schedule('* * * * *', async () => {
(async () => {
  try {
    // generate prompts
    const dallEPrompts = await getDallEPrompts();

    // generate images using DALL-E
    await generateDalleImages(dallEPrompts);

    // resize images

    // upload images to smb server
    return;
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
})();

// Run on Cloud
// export const handler = async () => {
//   try {
//     const dallEPrompts = await getDallEPrompts();

//     await generateDalleImages(dallEPrompts);

//     // generate images using DALL-E

//     // resize images

//     // upload images to smb server

//     console.log(dallEPrompts);

//     return {
//       statusCode: StatusCodes.OK,
//       body: JSON.stringify(dallEPrompts, null, 2),
//     };
//   } catch (err) {
//     let statusCode;
//     let message;

//     const error = err as Error;

//     switch (error.name) {
//       case 'ZodError':
//         statusCode = StatusCodes.BAD_REQUEST;
//         message = error.message;
//         break;
//       default:
//         statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
//         message = error.message;
//     }

//     return {
//       statusCode,
//       body: JSON.stringify({ message, name: error.name }, null, 2),
//     };
//   }
// };
