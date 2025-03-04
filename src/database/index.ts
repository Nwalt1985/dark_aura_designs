/**
 * Database Connection Module
 *
 * This module provides functions for connecting to and disconnecting from the MongoDB database.
 * It handles connection pooling, error handling, and graceful shutdown.
 *
 * The module exports two main functions:
 * - mongoConnect: Establishes a connection to the MongoDB database
 * - closeConnection: Closes the active MongoDB connection
 *
 * It also sets up a process event handler to ensure the database connection
 * is properly closed when the application terminates.
 */
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

/**
 * Establishes a connection to the MongoDB database
 *
 * This function creates or reuses a connection to the MongoDB database.
 * It implements connection pooling to efficiently manage database connections.
 *
 * @param collectionName - The name of the collection to connect to (defaults to 'ai_etsy_collection')
 * @returns An object containing the MongoDB client and collection
 * @throws DatabaseError if the connection fails
 */
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

/**
 * Closes the active MongoDB connection
 *
 * This function gracefully closes the connection to the MongoDB database.
 * It should be called when the application is shutting down to ensure
 * all database operations are properly completed.
 *
 * @throws DatabaseError if closing the connection fails
 */
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
