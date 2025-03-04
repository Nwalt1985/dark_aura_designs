/**
 * Image Generation CLI Module
 *
 * This module provides a command-line interface for generating product images.
 * It uses yargs to parse command-line arguments and delegates to the generateImagesFromRescale
 * function to process images for different product types and marketplaces.
 */
import { StatusCodes } from 'http-status-codes';
import { generateImagesFromRescale } from './generateImages';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getProductDetails } from '../../helpers';
import { Marketplace, ProductName } from '../../models/types/listing';
import { ErrorType, Logger } from '../../errors';
import { closeConnection } from '../../database';

/**
 * Command-line argument parser configuration.
 * Defines the expected arguments and their types.
 */
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

/**
 * Self-executing async function that serves as the entry point for the CLI.
 * Parses arguments, gets product details, and initiates the image generation process.
 * Handles errors and provides appropriate status codes and messages.
 */
void (async (): Promise<void> => {
  try {
    const argv = parser.parseSync();

    const product = getProductDetails(argv.product, argv.marketplace);

    await generateImagesFromRescale(product, argv.limit);

    // Close the database connection before exiting
    await closeConnection();
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

    Logger.error({
      type: ErrorType.INTERNAL,
      code: statusCode,
      message: message,
      details: error,
    });

    // Make sure to close the database connection even if there's an error
    await closeConnection();
  }
})();
