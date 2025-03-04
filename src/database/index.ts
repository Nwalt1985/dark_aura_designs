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
import { MongoClient, MongoClientOptions } from 'mongodb';
import { DatabaseError } from '../errors/CustomError';
import { Logger, handleError } from '../errors';

// Connection URL from environment variable with fallback
const url = process.env['MONGODB_URI'] || 'mongodb://localhost:27017';

// Enhanced connection options
const connectionOptions: MongoClientOptions = {
  maxPoolSize: 20,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
  w: 'majority',
};

const client = new MongoClient(url, connectionOptions);

// Database Name from environment variable with fallback
const dbName = process.env['MONGODB_DB_NAME'] || 'ai_etsy';

let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 1000;

/**
 * Attempts to connect to MongoDB with retry logic
 *
 * @returns {Promise<MongoClient>} Connected MongoDB client
 * @throws {DatabaseError} If connection fails after all retry attempts
 */
async function connectWithRetry(): Promise<MongoClient> {
  connectionAttempts++;

  try {
    await client.connect();
    connectionAttempts = 0; // Reset counter on successful connection
    return client;
  } catch (error) {
    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      Logger.warn(
        `MongoDB connection attempt ${connectionAttempts} failed. Retrying in ${RETRY_DELAY_MS}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * connectionAttempts));
      return connectWithRetry();
    }

    throw error;
  }
}

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
      await connectWithRetry();
      isConnected = true;
      Logger.info('Connected to MongoDB');

      // Set up connection monitoring
      client.on('connectionPoolCreated', (event) => {
        Logger.info(
          `MongoDB connection pool created with ${event.options.maxPoolSize} max connections`,
        );
      });

      client.on('connectionPoolClosed', () => {
        Logger.info('MongoDB connection pool closed');
        isConnected = false;
      });
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

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  Logger.error(handleError(reason instanceof Error ? reason : new Error(String(reason))));
  void closeConnection().then(() => process.exit(1));
});
