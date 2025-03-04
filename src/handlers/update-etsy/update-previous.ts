import dotenv from 'dotenv';
import { updateEtsyListingId } from '../../service/db';
import { getAllActiveListings } from '../../service/etsy';
import { Logger } from '../../errors/logger';
dotenv.config();

void (async (): Promise<void> => {
  const shopId = process.env['ETSY_SHOP_ID'] as string;

  const activeListings = await getAllActiveListings(shopId);

  if (!activeListings) {
    Logger.info('No active listings found');
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

    const firstSentence = description?.split('.')?.[0]?.trim() || description || '';

    await updateEtsyListingId(firstSentence, listingId, title);
  }
})();
