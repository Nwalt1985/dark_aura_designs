/**
 * Etsy Listing Update Module
 *
 * This module handles updating existing Etsy listings with current product information.
 * It retrieves active listings from Etsy, updates their details based on product type,
 * and synchronizes the Etsy listing IDs with the local database.
 *
 * The module supports various product types including desk mats, pillows, blankets,
 * and woven blankets, with specialized handling for each product type's materials and properties.
 */
import dotenv from 'dotenv';
import yargs from 'yargs';
import qs from 'qs';

import { hideBin } from 'yargs/helpers';

import { updateEtsyListingId } from '../../service/db';
import { EtsyListingType, EtsyListingRequestSchema } from '../../models/schemas/etsy';
import { getAllActiveListings, updateEtsyListing } from '../../service/etsy';
import {
  ProductName,
  DeskMatMaterials,
  PillowMaterials,
  BlanketMaterials,
  WovenBlanketMaterials,
} from '../../models/types/listing';
import { StatusCodes } from 'http-status-codes';
import { Logger } from '../../errors/logger';
import { ErrorType } from '../../errors/CustomError';
import { closeConnection } from '../../database';
dotenv.config();

/**
 * Command-line argument parser configuration.
 * Defines the expected arguments and their types for the Etsy update CLI.
 */
const parser = yargs(hideBin(process.argv))
  .options({
    product: {
      type: 'string',
      description: 'Product type for the listing',
      choices: Object.values(ProductName),
      default: ProductName.DESK_MAT,
    },
    limit: {
      type: 'number',
      description: 'Limit active listings',
      default: 25,
    },
  })
  .strict()
  .help();

/**
 * Self-executing async function that serves as the entry point for the CLI.
 * Retrieves active Etsy listings, updates their details based on product type,
 * and synchronizes the Etsy listing IDs with the local database.
 *
 * The function:
 * 1. Retrieves active listings from Etsy
 * 2. Filters listings based on product type
 * 3. Updates each listing with appropriate materials, properties, and tags
 * 4. Updates the local database with Etsy listing IDs
 *
 * Handles errors and provides appropriate status codes and messages.
 */
void (async (): Promise<void> => {
  try {
    const argv = parser.parseSync();
    const shopId = process.env['ETSY_SHOP_ID'] as string;

    const activeListings = await getAllActiveListings(shopId, argv.limit);

    if (!activeListings || !Array.isArray(activeListings) || activeListings.length === 0) {
      Logger.info('No active listings found');
      return;
    }

    // Ensure activeListings is an array
    const listingsArray = Array.isArray(activeListings) ? activeListings : [];

    let productTitleString: string = '';
    let materials: string = '';
    const shopSectionId: number = 0;

    switch (argv.product) {
      case ProductName.DESK_MAT:
        productTitleString = 'Desk Mat';
        materials = Object.values(DeskMatMaterials).join(',');
        break;
      case ProductName.PILLOW:
        productTitleString = 'Cushion';
        materials = Object.values(PillowMaterials).join(',');
        break;
      case ProductName.BLANKET:
        productTitleString = 'Blanket';
        materials = Object.values(BlanketMaterials).join(',');
        break;
      case ProductName.WOVEN_BLANKET:
        productTitleString = 'Woven Blanket';
        materials = Object.values(WovenBlanketMaterials).join(',');
        break;
    }

    const listingsToUpdate: EtsyListingType[] = listingsArray
      .filter((listing: EtsyListingType) => listing.tags.length === 0)
      .filter((listing: EtsyListingType) => listing.title.includes(productTitleString));

    Logger.info(`Listings to update: ${listingsToUpdate.length}`);

    for (const listing of listingsToUpdate) {
      const { listing_id, description, title } = listing;

      const firstSentence = description?.split('.')?.[0]?.trim() || description || '';

      const record = await updateEtsyListingId(firstSentence, listing_id, title);

      if (!record) {
        Logger.info(`No record found for description: ${firstSentence}`);
        continue;
      }

      delete record.buffer;

      record.keywords = record.keywords
        .map((keyword) => keyword.toLowerCase())
        .filter((keyword) => keyword.length <= 20);

      record.keywords = Array.from(new Set(record.keywords));

      if (record.keywords.length > 13) {
        record.keywords = record.keywords.slice(0, 13);
      }

      EtsyListingRequestSchema.parse(record.keywords);

      const data = qs.stringify({
        should_auto_renew: true,
        tags: record.keywords.join(','),
        materials,
        shop_section_id: shopSectionId,
        production_partner_ids: '4415768',
      });

      await updateEtsyListing(shopId, listing_id, title, data);
    }

    // Close the database connection before exiting
    await closeConnection();
    return;
  } catch (err: unknown) {
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

    // Close the database connection before exiting
    await closeConnection();

    Logger.error({
      type: ErrorType.INTERNAL,
      code: statusCode,
      message: message,
      details: error,
    });
  }
})();
