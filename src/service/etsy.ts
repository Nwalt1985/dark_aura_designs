/**
 * Etsy Service Module
 *
 * This module provides functions for interacting with the Etsy API.
 * It includes operations for pinging the Etsy API, retrieving active listings,
 * and updating existing listings.
 *
 * All API calls are wrapped in a utility function that provides
 * consistent error handling and logging.
 */
import axios, { AxiosResponse, AxiosError } from 'axios';
import dotenv from 'dotenv';
import { EtsyListingType } from '../models/schemas/etsy';
import { getEtsyAuthCredentials } from './db';
import { ExternalServiceError, handleError, Logger } from '../errors';

/**
 * Interface for the response from the Etsy ping endpoint
 */
interface PingResponse {
  application_id: number;
  ping: string;
}

/**
 * Interface for Etsy API error responses
 */
interface EtsyErrorResponse {
  error: string;
}

/**
 * Type guard to check if a response is an Etsy error
 *
 * @param data - The data to check
 * @returns True if the data is an Etsy error response
 */
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

/**
 * Pings the Etsy API to verify connectivity and authentication
 *
 * @returns The ping response from Etsy
 * @throws ExternalServiceError if the API call fails
 */
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

/**
 * Retrieves all active listings for a shop from Etsy
 *
 * @param shopId - The Etsy shop ID
 * @param limit - Optional limit on the number of listings to retrieve
 * @returns Array of active Etsy listings
 * @throws ExternalServiceError if the API call fails
 */
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
  ).then((response) => {
    // Extract the listings array from the response
    // The Etsy API likely returns an object with a 'results' or 'listings' property
    if (response && typeof response === 'object') {
      // Log the response structure to help debug
      Logger.info(`Etsy API response structure: ${JSON.stringify(Object.keys(response))}`);

      if (Array.isArray(response)) {
        return response;
      }

      // Check for common response structures
      if ('results' in response && Array.isArray(response.results)) {
        return response.results;
      }
      if ('listings' in response && Array.isArray(response.listings)) {
        return response.listings;
      }
      if ('count' in response && 'results' in response && Array.isArray(response.results)) {
        return response.results;
      }

      // If response is an object with numeric keys, it might be an array-like object
      // Convert it to a proper array
      const keys = Object.keys(response);
      if (keys.length > 0 && keys.every((key) => !isNaN(Number(key)))) {
        return Object.values(response);
      }
    }

    // Return an empty array if we couldn't find the listings
    Logger.warn('Could not find listings array in Etsy API response');
    return [];
  });
}

/**
 * Updates an existing Etsy listing
 *
 * @param shopId - The Etsy shop ID
 * @param listingId - The ID of the listing to update
 * @param title - The new title for the listing
 * @param data - The new description for the listing
 * @throws ExternalServiceError if the API call fails
 */
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
