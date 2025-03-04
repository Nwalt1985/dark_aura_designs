import { z } from 'zod';
import { mongoConnect } from '../database';
import { PromptResponse, PromptResponseType } from '../models/schemas/prompt';
import { DateTime } from 'luxon';
import he from 'he';
import { UpdateListingData } from '../models/schemas/db';
import { ObjectId } from 'mongodb';

export async function createDBListing(listing: z.infer<typeof PromptResponse>[]): Promise<{
  acknowledged: boolean;
  insertedCount: number;
  insertedIds: { [key: number]: ObjectId };
}> {
  const { client, collection } = await mongoConnect();

  const result = await collection.insertMany(listing);

  await client.close();

  return result;
}

export async function getAllListings(product: string): Promise<PromptResponseType[]> {
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

export async function getUnlisted(product: string): Promise<PromptResponseType[]> {
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

export async function deleteListingByFileName(filename: string): Promise<void> {
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

export async function updateListing(
  filename: string,
  productType: string,
  data: UpdateListingData,
): Promise<void> {
  const { client, collection } = await mongoConnect();

  await collection.updateOne(
    { filename, productType },
    {
      $set: data,
    },
  );

  await client.close();
}

export async function updateEtsyListingId(
  description: string,
  listingId: number,
  title: string,
): Promise<PromptResponseType | undefined> {
  const { client, collection } = await mongoConnect();

  const escapedSubstring = escapeRegex(description);

  const query = {
    description: { $regex: escapedSubstring, $options: 'i' }, // 'i' for case-insensitive
    deletedAt: null,
  };

  const document = (await collection.findOne(query)) as unknown as PromptResponseType & {
    _id: object;
  };

  if (!document) {
    process.stdout.write(`No document found for description: ${description}\n`);
    return;
  }

  if (!document.etsyListingId) {
    await collection.updateOne(
      { _id: document?._id },
      {
        $set: {
          etsyListingId: listingId,
          title: title,
        },
      },
    );
  }

  await client.close();
  return { ...document, etsyListingId: listingId };
}

function escapeRegex(string: string): string {
  const decodedString = he.decode(string);
  return decodedString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
}

export async function updateEtsyAuthCredentials(data: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  const currentAuth = await getEtsyAuthCredentials();

  const { client, collection } = await mongoConnect('etsy_auth');

  await collection.updateOne(
    { accessToken: currentAuth },
    {
      $set: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      },
    },
    {
      upsert: true,
    },
  );

  await client.close();
}

export async function getEtsyAuthCredentials(): Promise<string> {
  const { client, collection } = await mongoConnect('etsy_auth');

  const result = (await collection.findOne<{
    accessToken: string;
    refreshToken: string;
  }>({})) as
    | {
        accessToken: string;
        refreshToken: string;
      }
    | undefined;

  await client.close();

  return result?.accessToken || '';
}
