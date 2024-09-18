import { z } from 'zod';
import { mongoConnect } from '../database';
import { PromptResponse } from '../models/schemas/prompt';

export async function createDBListing(listing: z.infer<typeof PromptResponse>) {
  const { client, collection } = await mongoConnect();

  const result = await collection.insertMany(listing);

  await client.close();

  console.log(`Inserted ${result.insertedCount} listing(s)`);

  return result;
}
