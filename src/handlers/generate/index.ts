import { StatusCodes } from 'http-status-codes';
import { APIGatewayProxyResult } from 'aws-lambda';

import { getDallEPrompts } from './getPrompts';
import { generateDalleImages } from './generateImages';
import cron from 'node-cron';
import { createListing } from '../../service';
import { PromptResponse } from '../../models/schemas/prompt';

// Run locally
// cron.schedule('* * * * *', async () => {
(async () => {
  try {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    // generate prompts
    const dallEPrompts = await getDallEPrompts();

    // Add createdAt field to each prompt
    const formattedData = dallEPrompts.map((item) => ({
      ...item,
      createdAt: formattedDate,
    }));

    PromptResponse.parse(formattedData);

    console.log(`Successfully fetched ${dallEPrompts.length} prompts`);

    // generate images using DALL-E
    await generateDalleImages(formattedData, formattedDate);

    // create DB entry
    await createListing(formattedData);

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

    console.error({ name: error.name, statusCode, message });
  }
})();
