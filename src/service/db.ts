import { z } from 'zod';
import { mongoConnect } from '../database';
import { PromptResponse, PromptResponseType } from '../models/schemas/prompt';

export async function createDBListing(listing: z.infer<typeof PromptResponse>) {
  const { client, collection } = await mongoConnect();

  const result = await collection.insertMany(listing);

  await client.close();

  console.log(`Inserted ${result.insertedCount} listing(s)`);

  return result;
}

export async function getDBListings() {
  const { client, collection } = await mongoConnect();

  const result = (await collection
    .find({
      listedAt: null,
    })
    .toArray()) as unknown as PromptResponseType;

  await client.close();

  return result;
}

export async function deleteListingByFileName(filename: string) {
  const { client, collection } = await mongoConnect();

  await collection.deleteOne({ filename });

  await client.close();
}
