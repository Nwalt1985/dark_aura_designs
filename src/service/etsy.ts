import axios from 'axios';

import dotenv from 'dotenv';

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

export async function getAllActiveListings() {
  try {
    const { data } = await axios.get(
      'https://openapi.etsy.com/v3/application/shops/{shop_id}/listings/active',
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NodeJS',
          'x-api-key': process.env.ETSY_API_KEY,
        },
      },
    );
  } catch (error: any) {
    throw new Error(error);
  }
}
