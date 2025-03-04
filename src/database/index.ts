import { MongoClient } from 'mongodb';
import { DatabaseError } from '../errors/CustomError';
import { Logger, handleError } from '../errors';

// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

// Database Name
const dbName = 'ai_etsy';

let isConnected = false;

export async function mongoConnect(collectionName: string = 'ai_etsy_collection'): Promise<{
  client: MongoClient;
  collection: ReturnType<ReturnType<MongoClient['db']>['collection']>;
}> {
  try {
    if (!isConnected) {
      await client.connect();
      isConnected = true;
      Logger.info('Connected to MongoDB');
    }

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    return { client, collection };
  } catch (error: unknown) {
    // Reset the connection flag to ensure future connection attempts
    isConnected = false;
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new DatabaseError('Failed to connect to MongoDB', error);
  }
}

export async function closeConnection(): Promise<void> {
  try {
    if (isConnected) {
      await client.close();
      isConnected = false;
      Logger.info('Disconnected from MongoDB');
    }
  } catch (error: unknown) {
    // Reset the connection flag even when an error occurs
    isConnected = false;
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new DatabaseError('Failed to close MongoDB connection', error);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  void closeConnection().then(() => process.exit(0));
});
