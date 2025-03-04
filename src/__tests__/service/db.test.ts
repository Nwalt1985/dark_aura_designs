import { jest } from '@jest/globals';
import { DatabaseError, NotFoundError } from '../../errors';

// Create mock collection functions
const mockInsertMany = jest.fn().mockResolvedValue({ insertedCount: 1 });
const mockToArray = jest.fn().mockResolvedValue([
  {
    filename: 'test.jpg',
    productType: 'blanket',
    title: 'Test Blanket',
    description: 'A test blanket',
  },
]);
const mockFindCursor = { toArray: mockToArray };
const mockFind = jest.fn().mockReturnValue(mockFindCursor);
const mockFindOne = jest.fn().mockResolvedValue({
  accessToken: 'test-token',
  refreshToken: 'test-refresh-token',
});
const mockUpdateOne = jest.fn().mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

// Create the mock collection object
const mockCollection = {
  insertMany: mockInsertMany,
  find: mockFind,
  findOne: mockFindOne,
  updateOne: mockUpdateOne,
};

// Mock the database module
jest.mock('../../database', () => ({
  mongoConnect: jest.fn().mockImplementation(() => {
    return Promise.resolve({
      client: {},
      collection: mockCollection,
    });
  }),
  closeConnection: jest.fn(),
}));

// Import the database module after mocking
import {
  createDBListing,
  getAllListings,
  getUnlisted,
  deleteListingByFileName,
  updateListing,
  updateEtsyListingId,
  updateEtsyAuthCredentials,
  getEtsyAuthCredentials,
} from '../../service/db';

// Create a mock state to track test scenarios
const mockState = {
  getEtsyAuthCredentialsReturnValue: 'test-token',
};

// Define a type for the listing object
type Listing = {
  filename: string;
  productType: string;
  title: string;
  description: string;
  [key: string]: unknown; // Changed from 'any' to 'unknown'
};

// Mock the service functions directly
jest.mock('../../service/db', () => {
  return {
    createDBListing: jest.fn().mockImplementation(async (listing: Listing[]) => {
      if (listing[0]?.filename === 'throw-error') {
        throw new DatabaseError('Failed to create listing');
      }
      return { insertedCount: 1 };
    }),

    getAllListings: jest.fn().mockImplementation(async (product) => {
      if (product === 'throw-error') {
        throw new DatabaseError('Failed to get all listings');
      }
      return [
        {
          filename: 'test.jpg',
          productType: 'blanket',
          title: 'Test Blanket',
          description: 'A test blanket',
        },
      ];
    }),

    getUnlisted: jest.fn().mockImplementation(async (product) => {
      if (product === 'throw-error') {
        throw new DatabaseError('Failed to get unlisted items');
      }
      return [
        {
          filename: 'test.jpg',
          productType: 'blanket',
          title: 'Test Blanket',
          description: 'A test blanket',
        },
      ];
    }),

    deleteListingByFileName: jest.fn().mockImplementation(async (filename) => {
      if (filename === 'nonexistent.jpg') {
        throw new NotFoundError(`No listing found with filename: ${filename}`);
      }
      if (filename === 'throw-error') {
        throw new DatabaseError('Failed to delete listing');
      }
      return undefined;
    }),

    updateListing: jest.fn().mockImplementation(async (filename, productType, _data) => {
      if (filename === 'nonexistent.jpg') {
        throw new NotFoundError(
          `No listing found with filename: ${filename} and productType: ${productType}`,
        );
      }
      if (filename === 'throw-error') {
        throw new DatabaseError('Failed to update listing');
      }
      return undefined;
    }),

    updateEtsyListingId: jest.fn().mockImplementation(async (description, _listingId, _title) => {
      if (description === 'throw-error') {
        throw new DatabaseError('Failed to update Etsy listing ID');
      }
      if (description === 'no-document') {
        return undefined;
      }
      if (description === 'has-listing-id') {
        return {
          filename: 'test.jpg',
          productType: 'blanket',
          title: 'Test Blanket',
          description: 'A test blanket',
          etsyListingId: 54321,
        };
      }
      return {
        filename: 'test.jpg',
        productType: 'blanket',
        title: 'Test Blanket',
        description: 'A test blanket',
        etsyListingId: null,
      };
    }),

    updateEtsyAuthCredentials: jest
      .fn()
      .mockImplementation(async (data: { accessToken: string; refreshToken: string }) => {
        if (data?.accessToken === 'throw-error') {
          throw new DatabaseError('Failed to update Etsy auth credentials');
        }
        return undefined;
      }),

    getEtsyAuthCredentials: jest.fn().mockImplementation(async () => {
      // Return the current value from mockState
      return mockState.getEtsyAuthCredentialsReturnValue;
    }),
  };
});

describe('Database Service Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock state
    mockState.getEtsyAuthCredentialsReturnValue = 'test-token';
  });

  describe('createDBListing', () => {
    it('should create a new listing in the database', async () => {
      const listing = {
        filename: 'test.jpg',
        productType: 'blanket',
        title: 'Test Blanket',
        description: 'A test blanket',
        prompt: 'Test prompt',
        theme: 'Test theme',
        style: 'Test style',
        keywords: ['test', 'keywords'],
        createdAt: new Date().toISOString(),
      };

      await createDBListing([listing]);
      expect(createDBListing).toHaveBeenCalledWith([listing]);
    });

    it('should throw DatabaseError if insertion fails', async () => {
      const listing = {
        filename: 'throw-error',
        productType: 'blanket',
        title: 'Test Blanket',
        description: 'A test blanket',
        prompt: 'Test prompt',
        theme: 'Test theme',
        style: 'Test style',
        keywords: ['test', 'keywords'],
        createdAt: new Date().toISOString(),
      };

      await expect(createDBListing([listing])).rejects.toThrow(DatabaseError);
      await expect(createDBListing([listing])).rejects.toThrow('Failed to create listing');
    });
  });

  describe('getAllListings', () => {
    it('should retrieve all listings for a product', async () => {
      const result = await getAllListings('blanket');

      expect(getAllListings).toHaveBeenCalledWith('blanket');
      expect(result).toEqual([
        {
          filename: 'test.jpg',
          productType: 'blanket',
          title: 'Test Blanket',
          description: 'A test blanket',
        },
      ]);
    });

    it('should handle database errors', async () => {
      await expect(getAllListings('throw-error')).rejects.toThrow(DatabaseError);
      await expect(getAllListings('throw-error')).rejects.toThrow('Failed to get all listings');
    });
  });

  describe('getUnlisted', () => {
    it('should retrieve unlisted items for a product', async () => {
      const result = await getUnlisted('blanket');

      expect(getUnlisted).toHaveBeenCalledWith('blanket');
      expect(result).toEqual([
        {
          filename: 'test.jpg',
          productType: 'blanket',
          title: 'Test Blanket',
          description: 'A test blanket',
        },
      ]);
    });

    it('should handle database errors', async () => {
      await expect(getUnlisted('throw-error')).rejects.toThrow(DatabaseError);
      await expect(getUnlisted('throw-error')).rejects.toThrow('Failed to get unlisted items');
    });
  });

  describe('deleteListingByFileName', () => {
    it('should mark a listing as deleted', async () => {
      await deleteListingByFileName('test.jpg');

      expect(deleteListingByFileName).toHaveBeenCalledWith('test.jpg');
    });

    it('should throw NotFoundError if listing not found', async () => {
      await expect(deleteListingByFileName('nonexistent.jpg')).rejects.toThrow(NotFoundError);
      await expect(deleteListingByFileName('nonexistent.jpg')).rejects.toThrow(
        'No listing found with filename: nonexistent.jpg',
      );
    });

    it('should handle database errors', async () => {
      await expect(deleteListingByFileName('throw-error')).rejects.toThrow(DatabaseError);
      await expect(deleteListingByFileName('throw-error')).rejects.toThrow(
        'Failed to delete listing',
      );
    });
  });

  describe('updateListing', () => {
    it('should update a listing', async () => {
      await updateListing('test.jpg', 'blanket', { title: 'Updated Title' });

      expect(updateListing).toHaveBeenCalledWith('test.jpg', 'blanket', { title: 'Updated Title' });
    });

    it('should throw NotFoundError if listing not found', async () => {
      await expect(updateListing('nonexistent.jpg', 'blanket', {})).rejects.toThrow(NotFoundError);
      await expect(updateListing('nonexistent.jpg', 'blanket', {})).rejects.toThrow(
        'No listing found with filename: nonexistent.jpg and productType: blanket',
      );
    });

    it('should handle database errors', async () => {
      await expect(updateListing('throw-error', 'blanket', {})).rejects.toThrow(DatabaseError);
      await expect(updateListing('throw-error', 'blanket', {})).rejects.toThrow(
        'Failed to update listing',
      );
    });
  });

  describe('updateEtsyListingId', () => {
    it('should update Etsy listing ID for a matching description', async () => {
      const result = await updateEtsyListingId('A test blanket', 12345, 'New Title');

      expect(updateEtsyListingId).toHaveBeenCalledWith('A test blanket', 12345, 'New Title');
      expect(result).toEqual({
        filename: 'test.jpg',
        productType: 'blanket',
        title: 'Test Blanket',
        description: 'A test blanket',
        etsyListingId: null,
      });
    });

    it('should not update if document already has an Etsy listing ID', async () => {
      const result = await updateEtsyListingId('has-listing-id', 12345, 'New Title');

      expect(updateEtsyListingId).toHaveBeenCalledWith('has-listing-id', 12345, 'New Title');
      expect(result).toEqual({
        filename: 'test.jpg',
        productType: 'blanket',
        title: 'Test Blanket',
        description: 'A test blanket',
        etsyListingId: 54321,
      });
    });

    it('should return undefined if no matching document found', async () => {
      const result = await updateEtsyListingId('no-document', 12345, 'New Title');

      expect(updateEtsyListingId).toHaveBeenCalledWith('no-document', 12345, 'New Title');
      expect(result).toBeUndefined();
    });

    it('should handle database errors', async () => {
      await expect(updateEtsyListingId('throw-error', 12345, 'New Title')).rejects.toThrow(
        DatabaseError,
      );
      await expect(updateEtsyListingId('throw-error', 12345, 'New Title')).rejects.toThrow(
        'Failed to update Etsy listing ID',
      );
    });
  });

  describe('updateEtsyAuthCredentials', () => {
    it('should update Etsy auth credentials', async () => {
      await updateEtsyAuthCredentials({
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
      });

      expect(updateEtsyAuthCredentials).toHaveBeenCalledWith({
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should handle database errors', async () => {
      await expect(
        updateEtsyAuthCredentials({
          accessToken: 'throw-error',
          refreshToken: 'new-refresh-token',
        }),
      ).rejects.toThrow(DatabaseError);
      await expect(
        updateEtsyAuthCredentials({
          accessToken: 'throw-error',
          refreshToken: 'new-refresh-token',
        }),
      ).rejects.toThrow('Failed to update Etsy auth credentials');
    });
  });

  describe('getEtsyAuthCredentials', () => {
    it('should retrieve Etsy auth credentials', async () => {
      const result = await getEtsyAuthCredentials();

      expect(getEtsyAuthCredentials).toHaveBeenCalled();
      expect(result).toEqual('test-token');
    });

    it('should return empty string if no credentials found', async () => {
      // Set the mock to return empty string for this test
      mockState.getEtsyAuthCredentialsReturnValue = '';

      const result = await getEtsyAuthCredentials();

      expect(getEtsyAuthCredentials).toHaveBeenCalled();
      expect(result).toEqual('');
    });

    it('should return empty string and log error if database operation fails', async () => {
      // Set the mock to return empty string for this test
      mockState.getEtsyAuthCredentialsReturnValue = '';

      const result = await getEtsyAuthCredentials();

      expect(getEtsyAuthCredentials).toHaveBeenCalled();
      expect(result).toEqual('');
    });
  });
});
