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
import { getAllActiveListings } from '../../service/etsy';
import {
  BuildProductType,
  DeskMatMaterials,
  LaptopSleeveMaterials,
  LunchBagMaterials,
} from '../../models/types/listing';

dotenv.config();

const parser = yargs(hideBin(process.argv))
  .options({
    product: {
      type: 'string',
      description: 'Product type for the listing',
      demandOption: true,
      choices: Object.values(BuildProductType),
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
      case BuildProductType.DESK_MAT:
        productTitleString = 'Desk Mat';
        materials = Object.values(DeskMatMaterials).join(',');
        break;
      case BuildProductType.LAPTOP_SLEEVE:
        productTitleString = 'Laptop Sleeve';
        materials = Object.values(LaptopSleeveMaterials).join(',');
        shopSectionId = 51236977;
        break;
      case BuildProductType.LUNCH_BAG:
        productTitleString = 'Lunch Bag';
        shopSectionId = 51665176;
        materials = Object.values(LunchBagMaterials).join(',');
        break;
    }

    const listingsToUpdate: EtsyListingType[] = activeListings
      //   .filter((listing: EtsyListingType) => listing.should_auto_renew === false)
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
        materials,
        shop_section_id: shopSectionId,
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
    return;
  }
})();
