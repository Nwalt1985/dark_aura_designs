import { StatusCodes } from 'http-status-codes';
import { generateImagesFromRescale } from './generateImages';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getProductDetails } from '../../helpers';
import { Marketplace, ProductName } from '../../models/types/listing';

const parser = yargs(hideBin(process.argv))
  .options({
    product: {
      type: 'string',
      description: 'Product type for the listing',
      choices: Object.values(ProductName),
      demandOption: true,
    },
    marketplace: {
      type: 'string',
      description: 'Marketplace for the listing',
      choices: Object.values(Marketplace),
      demandOption: true,
    },
    limit: {
      type: 'number',
      description: 'Limit the number of prompts',
      default: 10,
    },
  })
  .strict()
  .help();

(async () => {
  try {
    const argv = parser.parseSync();

    const product = getProductDetails(argv.product, argv.marketplace);

    await generateImagesFromRescale(product, argv.limit);

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
