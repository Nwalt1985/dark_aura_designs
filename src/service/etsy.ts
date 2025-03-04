import axios, { AxiosResponse, AxiosError } from 'axios';
import dotenv from 'dotenv';
import { EtsyListingType } from '../models/schemas/etsy';
import { getEtsyAuthCredentials } from './db';

interface PingResponse {
  application_id: number;
  ping: string;
}

interface EtsyErrorResponse {
  error: string;
}

function isEtsyError(data: unknown): data is EtsyErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as EtsyErrorResponse).error === 'string'
  );
}

dotenv.config();

export async function pingEtsy(): Promise<PingResponse> {
  try {
    const response: AxiosResponse<PingResponse> = await axios.get(
      'https://openapi.etsy.com/v3/application/openapi-ping',
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NodeJS',
          'x-api-key': process.env.ETSY_API_KEY,
        },
      },
    );

    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response?.data && isEtsyError(error.response.data)) {
      throw new Error(error.response.data.error);
    }
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function getAllActiveListings(
  shopId: string,
  limit?: number,
): Promise<Array<EtsyListingType> | void> {
  try {
    const response: AxiosResponse<EtsyListingType[]> = await axios.get(
      `https://api.etsy.com/v3/application/shops/${shopId}/listings/active${limit ? `?limit=${limit}` : ''}`,
      {
        headers: {
          'x-api-key': process.env.ETSY_KEY_STRING || '',
        },
      },
    );

    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response?.data && isEtsyError(error.response.data)) {
      throw new Error(error.response.data.error);
    }
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw error;
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

    const response: AxiosResponse<EtsyListingType> = await axios.request(patchOptions);

    if (response.data) {
      process.stdout.write(`Updated listing: ${listingId} - ${title}\n`);
    }

    return;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response?.data && isEtsyError(error.response.data)) {
      throw new Error(error.response.data.error);
    }
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw error;
  }
}
