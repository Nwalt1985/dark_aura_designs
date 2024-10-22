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
import { z } from 'zod';

dotenv.config();

const parser = yargs(hideBin(process.argv))
  .options({
    product: {
      type: 'string',
      description: 'Product type for the listing',
      demandOption: true,
      choices: ['desk mat', 'laptop sleeve'],
    },
  })
  .strict() // Ensure that invalid options throw an error
  .help();

(async () => {
  try {
    const argv = parser.parseSync();
    const shopId = process.env.ETSY_SHOP_ID;

    const { data: activeListings } = await axios.get(
      `https://api.etsy.com/v3/application/shops/${shopId}/listings/active`,
      {
        headers: {
          'x-api-key': process.env.ETSY_KEY_STRING || '',
        },
      },
    );

    if (!activeListings) {
      console.log('No active listings found');
      return;
    }

    const listingsToUpdate: EtsyListingType[] =
      await activeListings.results.filter(
        (listing: any) => listing.should_auto_renew === false,
      );

    console.log(`Listings to update: ${listingsToUpdate.length}`);

    for (const listing of listingsToUpdate) {
      const { listing_id, description, state, title } = listing;

      const firstParagraph = description.split('\n')[0].trim();

      const record = await updateEtsyListingId(firstParagraph, listing_id);

      if (!record) {
        console.log(`No record found for description: ${firstParagraph}`);
        continue;
      }

      delete record.buffer;

      record.keywords = record.keywords.filter(
        (keyword) => keyword.length <= 20,
      );

      record.keywords = Array.from(new Set(record.keywords));

      if (record.keywords.length > 13) {
        record.keywords = record.keywords.slice(0, 13);
      }

      EtsyListingRequestSchema.parse(record.keywords);

      const data = qs.stringify({
        should_auto_renew: true,
        tags: record.keywords.join(','),
        shop_section_id: argv.product === 'desk mat' ? '51101821' : '51236977',
        materials:
          argv.product === 'desk mat'
            ? 'Rubber, Polyester'
            : 'Polyester, Nylon, Fleece',
        production_partner_ids: '4415768',
      });

      const patchOptions = {
        method: 'PATCH',
        url: `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${listing_id}`,
        data,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-api-key': process.env.ETSY_KEY_STRING,
          authorization: `Bearer ${process.env.ETSY_ACCESS_TOKEN}`,
        },
      };

      const { data: updatedListing } = await axios.request(patchOptions);

      if (updatedListing) {
        console.log(`Updated listing: ${listing_id} - ${title}`);
      }
    }
    return;
  } catch (error: any) {
    console.error(error);
  }
})();
