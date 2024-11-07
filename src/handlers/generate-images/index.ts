import { StatusCodes } from 'http-status-codes';
import { getDallEPrompts } from './queryWithOpenAi';
import {
  generateDalleImages,
  generateImagesFromRescale,
} from './generateImages';
import { PromptResponse } from '../../models/schemas/prompt';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { z } from 'zod';
import { getformattedDate, getProductDetails } from '../../helpers';
import { BuildProductType } from '../../models/types/listing';

const parser = yargs(hideBin(process.argv))
  .options({
    product: {
      type: 'string',
      description: 'Product type for the listing',
      demandOption: true,
      choices: Object.values(BuildProductType),
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
    exists: {
      type: 'boolean',
      description: 'Check if the images already exist in rescale folder',
      default: false,
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

    const product = getProductDetails(argv.product);

    if (!argv.exists) {
      // generate prompts
      const dallEPrompts = await getDallEPrompts({
        theme: argv.theme,
        style: argv.style,
        keywords: argv.keywords,
        limit: argv.limit,
        product,
        type: argv.product,
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
    } else {
      await generateImagesFromRescale(product);
    }

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
