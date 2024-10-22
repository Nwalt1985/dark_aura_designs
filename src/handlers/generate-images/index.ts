import { StatusCodes } from 'http-status-codes';
import { getDallEPrompts } from './getPrompts';
import { generateDalleImages } from './generateImages';
import { PromptResponse } from '../../models/schemas/prompt';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { z } from 'zod';
import { getformattedDate, getProductDetails } from '../../helpers';

const parser = yargs(hideBin(process.argv))
  .options({
    product: {
      type: 'string',
      description: 'Product type for the listing',
      demandOption: true,
      choices: ['desk mat', 'laptop sleeve'],
    },
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
      default: 5,
    },
  })
  .strict() // Ensure that invalid options throw an error
  .help();

(async () => {
  try {
    const formattedDate = getformattedDate();

    const argv = parser.parseSync();

    if (argv.style && argv.theme && !argv.keywords) {
      throw new Error(
        'Unique Keywords are required when providing a theme and style. Generic keywords will be added to the prompt automatically.',
      );
    }

    const product = getProductDetails(argv.product, formattedDate);

    // generate prompts
    const dallEPrompts = await getDallEPrompts({
      theme: argv.theme,
      style: argv.style,
      keywords: argv.keywords,
      limit: argv.limit,
      product,
    });

    // Add createdAt field to each prompt
    const formattedData = dallEPrompts.map((item) => ({
      ...item,
      createdAt: formattedDate,
    }));

    z.array(PromptResponse).parse(formattedData);

    console.log(`Successfully fetched ${dallEPrompts.length} prompts`);

    // generate images using DALL-E
    await generateDalleImages(formattedData, product, formattedDate);

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
