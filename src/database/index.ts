import { MongoClient } from 'mongodb';

// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'ai_etsy';

export async function mongoConnect(collectionName: string = 'ai_etsy_collection'): Promise<{
  client: MongoClient;
  collection: ReturnType<ReturnType<MongoClient['db']>['collection']>;
}> {
  await client.connect();

  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  return { client, collection };
}
