import { z } from 'zod';
import { mongoConnect } from '../database';
import { PromptResponse, PromptResponseType } from '../models/schemas/prompt';
import { DateTime } from 'luxon';

export async function createDBListing(
  listing: z.infer<typeof PromptResponse>[],
) {
  const { client, collection } = await mongoConnect();

  const result = await collection.insertMany(listing);

  await client.close();

  console.log(`Inserted ${result.insertedCount} listing(s)`);

  return result;
}

export async function getAllListings(product: string) {
  const { client, collection } = await mongoConnect();

  const result = (await collection
    .find({
      listedAt: { $ne: null },
      productType: {
        $eq: product,
      },
    })
    .toArray()) as unknown as PromptResponseType[];

  await client.close();

  return result;
}

export async function getUnlisted(product: string) {
  const { client, collection } = await mongoConnect();

  const result = (await collection
    .find({
      listedAt: null,
      deletedAt: null,
      productType: {
        $eq: product,
      },
    })
    .toArray()) as unknown as PromptResponseType[];

  await client.close();

  return result;
}

export async function deleteListingByFileName(filename: string) {
  const { client, collection } = await mongoConnect();

  await collection.updateOne(
    { filename },
    {
      $set: {
        deletedAt: DateTime.now().toFormat('dd-MM-yyyy'),
      },
    },
  );

  await client.close();
}

export async function updateListing(filename: string, productType: string) {
  const { client, collection } = await mongoConnect();

  await collection.updateOne(
    { filename, productType },
    {
      $set: {
        listedAt: DateTime.now().toFormat('dd-MM-yyyy'),
      },
    },
  );

  await client.close();
}

export async function updateEtsyListingId(
  description: string,
  listingId: number,
): Promise<PromptResponseType | undefined> {
  const { client, collection } = await mongoConnect();

  const escapedSubstring = escapeRegex(description);

  const query = { description: { $regex: escapedSubstring, $options: 'i' } }; // 'i' for case-insensitive
  const document = (await collection.findOne(
    query,
  )) as unknown as PromptResponseType & { _id: object };

  if (!document) {
    console.log(`No document found for description: ${description}`);
    return;
  }

  if (!document.etsyListingId) {
    await collection.updateOne(
      { _id: document?._id },
      {
        $set: {
          etsyListingId: listingId,
        },
      },
    );
  }

  await client.close();
  return { ...document, etsyListingId: listingId };
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
}
