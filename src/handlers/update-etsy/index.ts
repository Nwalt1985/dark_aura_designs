import axios from 'axios';
import dotenv from 'dotenv';
import yargs from 'yargs';
import qs from 'qs';

import { hideBin } from 'yargs/helpers';

import { updateEtsyListingId } from '../../service/db';
import {
  EtsyListingType,
  EtsyListingRequestSchema,
} from '../../models/schemas/etsy';
import { getAllActiveListings, updateEtsyListing } from '../../service/etsy';
import {
  ProductName,
  DeskMatMaterials,
  PillowMaterials,
  BlanketMaterials,
  WovenBlanketMaterials,
} from '../../models/types/listing';
import { StatusCodes } from 'http-status-codes';

dotenv.config();

const parser = yargs(hideBin(process.argv))
  .options({
    product: {
      type: 'string',
      description: 'Product type for the listing',
      choices: Object.values(ProductName),
      default: 'desk mat',
    },
    limit: {
      type: 'number',
      description: 'Limit active listings',
      default: 25,
    },
  })
  .strict()
  .help();

(async () => {
  try {
    const argv = parser.parseSync();
    const shopId = process.env.ETSY_SHOP_ID as string;

    const activeListings = await getAllActiveListings(shopId, argv.limit);

    if (!activeListings) {
      console.log('No active listings found');
      return;
    }

    let productTitleString: string = '';
    let materials: string = '';
    let shopSectionId: number = 0;

    switch (argv.product) {
      case ProductName.DESK_MAT:
        productTitleString = 'Desk Mat';
        materials = Object.values(DeskMatMaterials).join(',');
        break;
      case ProductName.PILLOW:
        productTitleString = 'Pillow';
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

    const listingsToUpdate: EtsyListingType[] = activeListings
      .filter((listing: EtsyListingType) => listing.tags.length === 0)
      .filter((listing: EtsyListingType) =>
        listing.title.includes(productTitleString),
      );

    console.log(`Listings to update: ${listingsToUpdate.length}`);

    for (const listing of listingsToUpdate) {
      const { listing_id, description, title } = listing;

      const firstSentence = description.split('.')[0].trim();

      const record = await updateEtsyListingId(
        firstSentence,
        listing_id,
        title,
      );

      if (!record) {
        console.log(`No record found for description: ${firstSentence}`);
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
    return;
  } catch (err: any) {
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

    console.error({ name: error.name, statusCode, message, error });
  }
})();
