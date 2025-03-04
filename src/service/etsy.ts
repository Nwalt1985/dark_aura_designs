import axios, { AxiosResponse, AxiosError } from 'axios';
import dotenv from 'dotenv';
import { EtsyListingType } from '../models/schemas/etsy';
import { getEtsyAuthCredentials } from './db';
import { ExternalServiceError, handleError, Logger } from '../errors';

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

/**
 * Utility function to make Etsy API calls with consistent error handling
 * @param apiCall Function that makes the actual API call
 * @param errorMessage Error message to use if the call fails
 * @returns Result of the API call
 */
async function executeEtsyApiCall<T>(
  apiCall: () => Promise<AxiosResponse<T>>,
  errorMessage: string,
): Promise<T> {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response?.data && isEtsyError(error.response.data)) {
      throw new ExternalServiceError(errorMessage, {
        error: error.response.data.error,
      });
    }

    const handledError = handleError(error);
    Logger.error(handledError);
    throw handledError;
  }
}

export async function pingEtsy(): Promise<PingResponse> {
  return executeEtsyApiCall(
    () =>
      axios.get('https://openapi.etsy.com/v3/application/openapi-ping', {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NodeJS',
          'x-api-key': process.env['ETSY_API_KEY'],
        },
      }),
    'Failed to ping Etsy API',
  );
}

export async function getAllActiveListings(
  shopId: string,
  limit?: number,
): Promise<Array<EtsyListingType>> {
  return executeEtsyApiCall(
    () =>
      axios.get(
        `https://api.etsy.com/v3/application/shops/${shopId}/listings/active${limit ? `?limit=${limit}` : ''}`,
        {
          headers: {
            'x-api-key': process.env['ETSY_KEY_STRING'] || '',
          },
        },
      ),
    'Failed to fetch Etsy listings',
  );
}

export async function updateEtsyListing(
  shopId: string,
  listingId: number,
  title: string,
  data: string,
): Promise<void> {
  const accessToken = await getEtsyAuthCredentials();

  await executeEtsyApiCall(
    () =>
      axios.request({
        method: 'PATCH',
        url: `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${listingId}`,
        data,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-api-key': process.env['ETSY_KEY_STRING'],
          authorization: `Bearer ${accessToken}`,
        },
      }),
    `Failed to update Etsy listing: ${title}`,
  );
}
