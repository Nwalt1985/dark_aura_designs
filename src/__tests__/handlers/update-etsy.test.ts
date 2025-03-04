import { jest } from '@jest/globals';
import { DatabaseError } from '../../errors';

// Mock yargs
jest.mock('yargs', () => {
  const mockYargs = {
    options: jest.fn().mockReturnThis(),
    strict: jest.fn().mockReturnThis(),
    help: jest.fn().mockReturnThis(),
    parseSync: jest.fn().mockReturnValue({
      product: 'blanket',
      limit: 25,
    }),
  };
  return jest.fn(() => mockYargs);
});

// Mock the required modules
jest.mock('../../service/db', () => ({
  updateEtsyListingId: jest.fn(),
  closeConnection: jest.fn(),
}));

jest.mock('../../service/etsy', () => ({
  getAllActiveListings: jest.fn(),
  updateEtsyListing: jest.fn(),
}));

jest.mock('../../database', () => ({
  closeConnection: jest.fn(),
}));

// Import the mocked modules
import { updateEtsyListingId } from '../../service/db';
import { getAllActiveListings, updateEtsyListing } from '../../service/etsy';
import { closeConnection } from '../../database';

// Mock environment variables
const originalEnv = process.env;

describe('update-etsy handler', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv, ETSY_SHOP_ID: 'test-shop-id' };

    // Mock console methods to prevent output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('getAllActiveListings', () => {
    it('should fetch active listings from Etsy', async () => {
      // Mock implementation
      (getAllActiveListings as jest.Mock).mockResolvedValue([
        {
          listing_id: 12345,
          title: 'Test Desk Mat',
          description: 'A test description',
          tags: [],
        },
      ]);

      // Call the function
      const result = await getAllActiveListings('test-shop-id', 25);

      // Assertions
      expect(getAllActiveListings).toHaveBeenCalledWith('test-shop-id', 25);
      expect(result).toHaveLength(1);
      expect(result[0]?.listing_id).toBe(12345);
    });

    it('should handle errors when fetching listings', async () => {
      // Mock implementation to throw an error
      (getAllActiveListings as jest.Mock).mockRejectedValue(new Error('Failed to fetch listings'));

      // Call and assert
      await expect(getAllActiveListings('test-shop-id', 25)).rejects.toThrow(
        'Failed to fetch listings',
      );
    });
  });

  describe('updateEtsyListingId', () => {
    it('should update Etsy listing ID in the database', async () => {
      // Mock implementation
      (updateEtsyListingId as jest.Mock).mockResolvedValue({
        filename: 'test.jpg',
        productType: 'blanket',
        title: 'Test Blanket',
        description: 'A test blanket',
        keywords: ['test', 'blanket', 'cozy'],
      });

      // Call the function
      const result = await updateEtsyListingId('A test blanket', 12345, 'Test Blanket');

      // Assertions
      expect(updateEtsyListingId).toHaveBeenCalledWith('A test blanket', 12345, 'Test Blanket');
      expect(result).toHaveProperty('keywords');
      expect(result?.keywords).toContain('test');
    });

    it('should handle not found errors', async () => {
      // Mock implementation to return null (no record found)
      (updateEtsyListingId as jest.Mock).mockResolvedValue(null);

      // Call the function
      const result = await updateEtsyListingId('Nonexistent description', 12345, 'Test Title');

      // Assertions
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Mock implementation to throw a database error
      (updateEtsyListingId as jest.Mock).mockRejectedValue(
        new DatabaseError('Failed to update Etsy listing ID'),
      );

      // Call and assert
      await expect(updateEtsyListingId('A test blanket', 12345, 'Test Blanket')).rejects.toThrow(
        DatabaseError,
      );
    });
  });

  describe('updateEtsyListing', () => {
    it('should update an Etsy listing', async () => {
      // Mock implementation
      (updateEtsyListing as jest.Mock).mockResolvedValue({
        listing_id: 12345,
        title: 'Updated Title',
        description: 'Updated description',
      });

      // Call the function
      await updateEtsyListing('test-shop-id', 12345, 'Updated Title', 'tags=test,blanket');

      // Assertions
      expect(updateEtsyListing).toHaveBeenCalledWith(
        'test-shop-id',
        12345,
        'Updated Title',
        'tags=test,blanket',
      );
    });

    it('should handle errors when updating listings', async () => {
      // Mock implementation to throw an error
      (updateEtsyListing as jest.Mock).mockRejectedValue(new Error('Failed to update listing'));

      // Call and assert
      await expect(
        updateEtsyListing('test-shop-id', 12345, 'Test Title', 'tags=test'),
      ).rejects.toThrow('Failed to update listing');
    });
  });

  describe('closeConnection', () => {
    it('should close the database connection', async () => {
      // Mock implementation
      (closeConnection as jest.Mock).mockResolvedValue(undefined);

      // Call the function
      await closeConnection();

      // Assertions
      expect(closeConnection).toHaveBeenCalled();
    });
  });
});
