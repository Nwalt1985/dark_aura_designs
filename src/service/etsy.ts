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
import {
  EtsyListingType,
  EtsyInventoryType,
  EtsyInventoryUpdateType,
} from '../models/schemas/etsy';
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
  const allListings: Array<EtsyListingType> = [];
  let offset = 0;
  const pageSize = 100; // Maximum allowed by Etsy API
  let hasMore = true;

  while (hasMore && (!limit || allListings.length < limit)) {
    const response = await executeEtsyApiCall(
      () =>
        axios.get(
          `https://api.etsy.com/v3/application/shops/${shopId}/listings/active?limit=${pageSize}&offset=${offset}`,
          {
            headers: {
              'x-api-key': process.env['ETSY_KEY_STRING'] || '',
            },
          },
        ),
      'Failed to fetch Etsy listings',
    );

    // Handle different possible response structures
    let results: Array<EtsyListingType> = [];
    if (Array.isArray(response)) {
      results = response;
    } else if (response.results && Array.isArray(response.results)) {
      results = response.results;
    } else if (response.listings && Array.isArray(response.listings)) {
      results = response.listings;
    }

    if (results.length === 0) {
      Logger.warn('No results found in response');
      break;
    }

    allListings.push(...results);
    offset += results.length;
    hasMore = results.length === pageSize;

    // If we've hit the limit, trim the results
    if (limit && allListings.length >= limit) {
      allListings.length = limit;
      break;
    }

    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  Logger.info(`Final total: Retrieved ${allListings.length} listings`);
  return allListings;
}

export async function getListingInventory(listingId: number): Promise<EtsyInventoryType> {
  const accessToken = await getEtsyAuthCredentials();

  return executeEtsyApiCall(
    () =>
      axios.get(`https://openapi.etsy.com/v3/application/listings/${listingId}/inventory`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-api-key': process.env['ETSY_KEY_STRING'],
          authorization: `Bearer ${accessToken}`,
        },
      }),
    'Failed to fetch Etsy listings',
  ).then((response) => {
    if (!response) {
      // Return an empty array if we couldn't find the listings
      Logger.warn('Could not find listings array in Etsy API response');
      return [];
    }

    return response;
  });
}

export async function updateListingInventory(
  listingId: number,
  data: EtsyInventoryUpdateType,
): Promise<void> {
  const accessToken = await getEtsyAuthCredentials();

  return executeEtsyApiCall(
    () =>
      axios.request({
        method: 'PUT',
        url: `https://openapi.etsy.com/v3/application/listings/${listingId}/inventory`,
        data,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-api-key': process.env['ETSY_KEY_STRING'],
          authorization: `Bearer ${accessToken}`,
        },
      }),
    'Failed to update Etsy listings',
  ).then((response) => {
    if (!response) {
      // Return an empty array if we couldn't find the listings
      Logger.warn('Could not find listings array in Etsy API response');
      return [];
    }

    return response;
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
