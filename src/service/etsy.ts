import axios from 'axios';

import dotenv from 'dotenv';
import { EtsyListingType } from '../models/schemas/etsy';
import { getEtsyAuthCredentials } from './db';

dotenv.config();

export async function pingEtsy() {
  try {
    const { data } = await axios.get(
      'https://openapi.etsy.com/v3/application/openapi-ping',
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NodeJS',
          'x-api-key': process.env.ETSY_API_KEY,
        },
      },
    );

    return data;
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function getAllActiveListings(
  shopId: string,
  limit?: number,
): Promise<Array<EtsyListingType> | void> {
  try {
    const { data: activeListings } = await axios.get(
      `https://api.etsy.com/v3/application/shops/${shopId}/listings/active${limit ? `?limit=${limit}` : ''}`,
      {
        headers: {
          'x-api-key': process.env.ETSY_KEY_STRING || '',
        },
      },
    );

    return activeListings.results as EtsyListingType[];
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function updateEtsyListing(
  shopId: string,
  listingId: number,
  title: string,
  data: string,
): Promise<void> {
  try {
    const accessToken = await getEtsyAuthCredentials();

    const patchOptions = {
      method: 'PATCH',
      url: `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${listingId}`,
      data,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-api-key': process.env.ETSY_KEY_STRING,
        authorization: `Bearer ${accessToken}`,
      },
    };

    const { data: updatedListing } = await axios.request(patchOptions);

    if (updatedListing) {
      console.log(`Updated listing: ${listingId} - ${title}`);
    } else {
      console.log(`Failed to update listing: ${listingId} - ${title}`);
    }

    return;
  } catch (err) {
    throw new Error(err as any);
  }
}
