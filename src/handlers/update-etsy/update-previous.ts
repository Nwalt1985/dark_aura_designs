import dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { updateEtsyListingId } from '../../service/db';
import { getAllActiveListings } from '../../service/etsy';

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
  const argv = parser.parseSync();
  const shopId = process.env.ETSY_SHOP_ID as string;

  const activeListings = await getAllActiveListings(shopId);

  if (!activeListings) {
    console.log('No active listings found');
    return;
  }

  const listings = activeListings
    .filter((listing) => listing.shop_section_id === 51101821) // return desk mats only
    .map((listing) => ({
      listingId: listing.listing_id,
      description: listing.description,
      title: listing.title,
    }));

  for (const listing of listings) {
    const { listingId, description, title } = listing;

    const firstSentence = description.split('.')[0].trim();

    await updateEtsyListingId(firstSentence, listingId, title);
  }
})();
