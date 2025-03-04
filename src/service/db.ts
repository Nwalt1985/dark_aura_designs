/**
 * Database Service Module
 *
 * This module provides functions for interacting with the MongoDB database.
 * It includes operations for creating, retrieving, updating, and deleting listings,
 * as well as managing Etsy authentication credentials.
 *
 * All database operations are wrapped in a utility function that provides
 * consistent error handling and logging.
 */
import { z } from 'zod';
import { mongoConnect } from '../database';
import { PromptResponse, PromptResponseType } from '../models/schemas/prompt';
import { DateTime } from 'luxon';
import he from 'he';
import { UpdateListingData } from '../models/schemas/db';
import { ObjectId, Collection } from 'mongodb';
import { Logger, handleError, DatabaseError, NotFoundError } from '../errors';

/**
 * Utility function to execute database operations with proper error handling
 * @param operation Function that performs the database operation
 * @param errorMessage Error message to use if the operation fails
 * @returns Result of the database operation
 */
async function executeDbOperation<T>(
  operation: (collection: Collection) => Promise<T>,
  errorMessage: string,
): Promise<T> {
  const { collection } = await mongoConnect();

  try {
    return await operation(collection);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new DatabaseError(errorMessage, error);
  }
}

export async function createDBListing(listing: z.infer<typeof PromptResponse>[]): Promise<{
  acknowledged: boolean;
  insertedCount: number;
  insertedIds: { [key: number]: ObjectId };
}> {
  return executeDbOperation(async (collection) => {
    const result = await collection.insertMany(listing);
    if (!result) {
      throw new DatabaseError('Failed to create listing - No result returned');
    }
    return result;
  }, 'Failed to create listing');
}

export async function getAllListings(product: string): Promise<PromptResponseType[]> {
  return executeDbOperation(async (collection) => {
    return (await collection
      .find({
        listedAt: { $ne: null },
        productType: {
          $eq: product,
        },
      })
      .toArray()) as unknown as PromptResponseType[];
  }, 'Failed to get all listings');
}

export async function getUnlisted(product: string): Promise<PromptResponseType[]> {
  return executeDbOperation(async (collection) => {
    return (await collection
      .find({
        listedAt: null,
        deletedAt: null,
        productType: {
          $eq: product,
        },
      })
      .toArray()) as unknown as PromptResponseType[];
  }, 'Failed to get unlisted items');
}

export async function deleteListingByFileName(filename: string): Promise<void> {
  return executeDbOperation(async (collection) => {
    const result = await collection.updateOne(
      { filename },
      {
        $set: {
          deletedAt: DateTime.now().toFormat('dd-MM-yyyy'),
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundError(`No listing found with filename: ${filename}`);
    }
  }, 'Failed to delete listing');
}

export async function updateListing(
  filename: string,
  productType: string,
  data: UpdateListingData,
): Promise<void> {
  return executeDbOperation(async (collection) => {
    const result = await collection.updateOne({ filename, productType }, { $set: data });

    if (result.matchedCount === 0) {
      throw new NotFoundError(
        `No listing found with filename: ${filename} and productType: ${productType}`,
      );
    }
  }, 'Failed to update listing');
}

function escapeRegex(string: string): string {
  const decodedString = he.decode(string);
  return decodedString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function updateEtsyListingId(
  description: string,
  listingId: number,
  title: string,
): Promise<PromptResponseType | undefined> {
  return executeDbOperation(async (collection) => {
    const escapedSubstring = escapeRegex(description);
    const query = {
      description: { $regex: escapedSubstring, $options: 'i' },
      deletedAt: null,
    };

    const document = (await collection.findOne(query)) as unknown as
      | (PromptResponseType & {
          _id: object;
        })
      | null;

    if (!document) {
      return undefined;
    }

    if (!document.etsyListingId) {
      await collection.updateOne(
        { _id: document._id },
        {
          $set: {
            etsyListingId: listingId,
            title: title,
          },
        },
      );
    }

    return { ...document, etsyListingId: listingId } as PromptResponseType;
  }, 'Failed to update Etsy listing ID');
}

export async function updateEtsyAuthCredentials(data: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  try {
    const { collection } = await mongoConnect('etsy_auth');

    // Use a more reliable query that doesn't depend on existing credentials
    await collection.updateOne(
      {}, // Empty filter to match any document
      {
        $set: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          updatedAt: new Date(),
        },
      },
      {
        upsert: true, // Create if it doesn't exist
      },
    );

    Logger.info('Successfully updated Etsy auth credentials');
  } catch (error) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new DatabaseError('Failed to update Etsy auth credentials', error);
  }
}

export async function getEtsyAuthCredentials(): Promise<string> {
  try {
    const { collection } = await mongoConnect('etsy_auth');

    const result = (await collection.findOne<{
      accessToken: string;
      refreshToken: string;
    }>({})) as
      | {
          accessToken: string;
          refreshToken: string;
        }
      | undefined;

    return result?.accessToken || '';
  } catch (error) {
    const handledError = handleError(error);
    Logger.error(handledError);
    return '';
  }
}
