import { StatusCodes } from 'http-status-codes';
import { generateImagesFromRescale } from './generateImages';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getProductDetails } from '../../helpers';
import { BuildProductType } from '../../models/types/listing';

const parser = yargs(hideBin(process.argv))
  .options({
    product: {
      type: 'string',
      description: 'Product type for the listing',
      choices: Object.values(BuildProductType),
      default: 'desk mat',
    },
    limit: {
      type: 'number',
      description: 'Limit the number of prompts',
      default: 5,
    },
  })
  .strict()
  .help();

(async () => {
  try {
    const argv = parser.parseSync();

    if (argv.style && argv.theme && !argv.keywords) {
      throw new Error(
        'Unique Keywords are required when providing a theme and style. Generic keywords will be added to the prompt automatically.',
      );
    }

    const product = getProductDetails(argv.product);

    await generateImagesFromRescale(product, argv.limit);

    console.log('Images generation complete');

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
