import { StatusCodes } from 'http-status-codes';

import { getDallEPrompts } from './getPrompts';
import { generateDalleImages } from './generateImages';
import cron from 'node-cron';
import { PromptResponse } from '../../models/schemas/prompt';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const parser = yargs(hideBin(process.argv))
  .options({
    theme: {
      type: 'string',
      description: 'Theme for the DALL-E prompts',
      demandOption: false,
    },
    style: {
      type: 'string',
      description: 'Style for the DALL-E prompts',
      demandOption: false,
    },
    keywords: {
      type: 'string',
      description: 'Keywords for the listing',
      demandOption: false,
    },
    limit: {
      type: 'number',
      description: 'Limit the number of prompts',
      default: 3,
    },
  })
  .strict() // Ensure that invalid options throw an error
  .help();

// Run locally
// cron.schedule('* * * * *', async () => {
(async () => {
  try {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    const argv = parser.parseSync();

    // generate prompts
    const dallEPrompts = await getDallEPrompts({
      theme: argv.theme,
      style: argv.style,
      keywords: argv.keywords,
      limit: argv.limit,
    });

    // Add createdAt field to each prompt
    const formattedData = dallEPrompts.map((item) => ({
      ...item,
      createdAt: formattedDate,
    }));

    PromptResponse.parse(formattedData);

    console.log(`Successfully fetched ${dallEPrompts.length} prompts`);

    // generate images using DALL-E
    await generateDalleImages(formattedData, formattedDate);

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
