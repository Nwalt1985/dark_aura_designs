import axios from 'axios';

import dotenv from 'dotenv';
import { EtsyListingType } from '../models/schemas/etsy';

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
