/**
 * Database Utilities Module
 *
 * This module provides utility functions for database operations and cleanup.
 */
import { PromptResponseType } from '../models/schemas/prompt';
import { deleteListingByFileName, getUnlisted } from '../service/db';
import { Product } from '../models/types/listing';
import { Logger } from '../errors';
import { getGeneratedFileNames } from './productConfig';

/**
 * Cleans up database listings that no longer have corresponding image files.
 * Compares database listings with actual files in the product directory and
 * removes any database entries that don't have matching files.
 *
 * @param {PromptResponseType[]} unlisted - Array of database listings to check
 * @param {Product} product - Product configuration object
 * @returns {Promise<PromptResponseType[]>} Updated array of unlisted items after cleanup
 */
export async function dbTidy(
  unlisted: PromptResponseType[],
  product: Product,
): Promise<PromptResponseType[]> {
  const unlistedFileNames = unlisted.map((listing) => {
    if (!listing.filename) {
      Logger.warn('No filename found for listing', listing);
    }
    return listing.filename.replace(/(-\d+x\d+)?$/, '');
  });

  const generatedImagesFilenames = getGeneratedFileNames(product.baseDir, product.name);

  for (const listing of unlistedFileNames) {
    if (!generatedImagesFilenames.includes(listing)) {
      Logger.info(`Deleting ${listing} from the DB`);
      await deleteListingByFileName(listing);
    }
  }

  return await getUnlisted(product.name);
}
