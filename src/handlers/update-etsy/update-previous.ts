/**
 * Etsy Previous Listings Update Module
 *
 * This module handles synchronizing existing Etsy listings with the local database.
 * It retrieves active listings from Etsy, extracts their descriptions and titles,
 * and updates the local database with the Etsy listing IDs.
 *
 * This is primarily used for one-time synchronization of existing listings that
 * were created before the automated system was in place.
 */
import dotenv from 'dotenv';
import { updateEtsyListingId } from '../../service/db';
import { getAllActiveListings } from '../../service/etsy';
import { Logger } from '../../errors/logger';
dotenv.config();

/**
 * Self-executing async function that serves as the entry point.
 * Retrieves active Etsy listings, filters for desk mats, and updates
 * the local database with their listing IDs.
 *
 * The function:
 * 1. Retrieves all active listings from Etsy
 * 2. Filters listings to include only desk mats (by shop section ID)
 * 3. Extracts the first sentence of each description as a unique identifier
 * 4. Updates the local database with the Etsy listing ID and title
 */
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
