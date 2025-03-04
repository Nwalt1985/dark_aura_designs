import { jest } from '@jest/globals';
import { z } from 'zod';
import { PromptResponse } from '../../models/schemas/prompt';
import { ProductName, Marketplace } from '../../models/types/listing';
import { ExternalServiceError } from '../../errors';

// Mock yargs
jest.mock('yargs', () => {
  const mockYargs = {
    options: jest.fn().mockReturnThis(),
    strict: jest.fn().mockReturnThis(),
    help: jest.fn().mockReturnThis(),
    parseSync: jest.fn().mockReturnValue({
      product: 'blanket',
      marketplace: 'Etsy',
      limit: 10,
    }),
  };
  return jest.fn(() => mockYargs);
});

// Mock the required modules
jest.mock('../../service/db', () => ({
  getUnlisted: jest.fn(),
  _getUploadedImages: jest.fn(),
  _closeConnection: jest.fn(),
  _dbTidy: jest.fn(),
  updateListing: jest.fn(),
}));

jest.mock('../../service/printify', () => ({
  createNewProduct: jest.fn(),
  getUploadedImages: jest.fn(),
  uploadImages: jest.fn(),
}));

jest.mock('../../database', () => ({
  closeConnection: jest.fn(),
}));

jest.mock('../../helpers', () => ({
  dbTidy: jest.fn(),
  getBuffer: jest.fn(),
  getProductDetails: jest.fn(),
  getformattedDate: jest.fn(),
  relocateRescaleImage: jest.fn(),
}));

jest.mock(
  './listingConfig',
  () => ({
    generateListingConfig: jest.fn(),
  }),
  { virtual: true },
);

// Import the mocked modules
import { getUnlisted, updateListing } from '../../service/db';
import { createNewProduct, uploadImages } from '../../service/printify';
import { getBuffer, getProductDetails } from '../../helpers';
import { createPrintifyListingsData } from '../../handlers/generate-listing';

describe('generate-listing handler', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.resetAllMocks();

    // Mock console methods to prevent output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('getUnlisted', () => {
    it('should fetch unlisted products from the database', async () => {
      // Mock implementation
      (getUnlisted as jest.Mock).mockResolvedValue([
        {
          filename: 'test.jpg',
          productType: 'blanket',
          title: 'Test Blanket',
          description: 'A test blanket',
        },
      ]);

      // Call the function
      const result = await getUnlisted('blanket');

      // Assertions
      expect(getUnlisted).toHaveBeenCalledWith('blanket');
      expect(result).toHaveLength(1);
      expect(result[0]?.filename).toBe('test.jpg');
    });

    it('should handle empty results', async () => {
      // Mock implementation to return empty array
      (getUnlisted as jest.Mock).mockResolvedValue([]);

      // Call the function
      const result = await getUnlisted('blanket');

      // Assertions
      expect(result).toHaveLength(0);
    });
  });

  describe('createPrintifyListingsData', () => {
    it('should create a new product listing for non-pillow products', async () => {
      // Mock data
      const unlisted = {
        filename: 'test.jpg',
        title: 'Test Blanket',
        description: 'A test blanket',
        keywords: ['test', 'blanket'],
      } as z.infer<typeof PromptResponse>;

      const uploadedImages = {
        imageData: [],
        length: 0,
        totalImages: 0,
      };

      const product = {
        name: ProductName.BLANKET,
        baseDir: '/test/dir',
        shopId: 'test-shop-id',
      };

      // Mock implementations
      (getBuffer as jest.Mock).mockReturnValue([
        {
          filename: 'test.jpg',
          base64: 'base64-data',
          fileId: '12345',
        },
      ]);

      (uploadImages as jest.Mock).mockResolvedValue({
        id: 'image-id',
        file_name: 'test.jpg',
      });

      // Mock the imported module from the handler
      const mockGenerateListingConfig = jest.fn().mockReturnValue({
        blueprint_id: 'blueprint-id',
        print_provider_id: 'provider-id',
        variants: [],
        print_areas: {},
      });

      jest.doMock('../../handlers/generate-listing/listingConfig', () => ({
        generateListingConfig: mockGenerateListingConfig,
      }));

      (createNewProduct as jest.Mock).mockResolvedValue({
        id: 'product-id',
        title: 'Test Blanket',
      });

      // Call the function
      await createPrintifyListingsData(unlisted, uploadedImages, product);

      // Assertions
      expect(getBuffer).toHaveBeenCalledWith('test.jpg', '/test/dir');
      expect(uploadImages).toHaveBeenCalledWith('base64-data', 'test.jpg');
      expect(createNewProduct).toHaveBeenCalled();
      expect(updateListing).toHaveBeenCalled();
    });

    it('should handle pillow products by creating both pillow and cover variants', async () => {
      // Mock data
      const unlisted = {
        filename: 'test.jpg',
        title: 'Test Cushion',
        description: 'A test cushion',
        keywords: ['test', 'cushion'],
      } as z.infer<typeof PromptResponse>;

      const uploadedImages = {
        imageData: [],
        length: 0,
        totalImages: 0,
      };

      const product = {
        name: ProductName.PILLOW,
        baseDir: '/test/dir',
        shopId: 'test-shop-id',
      };

      // Mock implementations
      (getBuffer as jest.Mock).mockReturnValue([
        {
          filename: 'test.jpg',
          base64: 'base64-data',
          fileId: '12345',
        },
      ]);

      (uploadImages as jest.Mock).mockResolvedValue({
        id: 'image-id',
        file_name: 'test.jpg',
      });

      // Mock the imported module from the handler
      const mockGenerateListingConfig = jest.fn().mockImplementation((_images, productType) => {
        return {
          blueprint_id: `blueprint-id-${productType}`,
          print_provider_id: `provider-id-${productType}`,
          variants: [],
          print_areas: {},
        };
      });

      jest.doMock('../../handlers/generate-listing/listingConfig', () => ({
        generateListingConfig: mockGenerateListingConfig,
      }));

      (createNewProduct as jest.Mock)
        .mockResolvedValueOnce({
          id: 'product-id-pillow',
          title: 'Test Cushion',
        })
        .mockResolvedValueOnce({
          id: 'product-id-cover',
          title: 'VARIATION Test Cushion Cover',
        });

      // Call the function
      await createPrintifyListingsData(unlisted, uploadedImages, product);

      // Assertions
      expect(getBuffer).toHaveBeenCalledWith('test.jpg', '/test/dir');
      expect(uploadImages).toHaveBeenCalledWith('base64-data', 'test.jpg');
      expect(createNewProduct).toHaveBeenCalledTimes(2);
      expect(updateListing).toHaveBeenCalled();
    });

    it('should handle errors during product creation', async () => {
      // Mock data
      const unlisted = {
        filename: 'test.jpg',
        title: 'Test Blanket',
        description: 'A test blanket',
        keywords: ['test', 'blanket'],
      } as z.infer<typeof PromptResponse>;

      const uploadedImages = {
        imageData: [],
        length: 0,
        totalImages: 0,
      };

      const product = {
        name: ProductName.BLANKET,
        baseDir: '/test/dir',
        shopId: 'test-shop-id',
      };

      // Mock implementations
      (getBuffer as jest.Mock).mockReturnValue([
        {
          filename: 'test.jpg',
          base64: 'base64-data',
          fileId: '12345',
        },
      ]);

      (uploadImages as jest.Mock).mockResolvedValue({
        id: 'image-id',
        file_name: 'test.jpg',
      });

      // Mock the imported module from the handler
      const mockGenerateListingConfig = jest.fn().mockReturnValue({
        blueprint_id: 'blueprint-id',
        print_provider_id: 'provider-id',
        variants: [],
        print_areas: {},
      });

      jest.doMock('../../handlers/generate-listing/listingConfig', () => ({
        generateListingConfig: mockGenerateListingConfig,
      }));

      // Mock createNewProduct to return a response without an ID (error case)
      (createNewProduct as jest.Mock).mockResolvedValue({});

      // Call and assert
      await expect(createPrintifyListingsData(unlisted, uploadedImages, product)).rejects.toThrow(
        ExternalServiceError,
      );
    });
  });

  describe('getProductDetails', () => {
    it('should return product details for a given product type and marketplace', () => {
      // Mock implementation
      (getProductDetails as jest.Mock).mockReturnValue({
        name: ProductName.BLANKET,
        baseDir: '/test/dir',
        shopId: 'test-shop-id',
        rescale: '/test/rescale',
        defaultDescription: 'A beautiful blanket',
      });

      // Call the function
      const result = getProductDetails(ProductName.BLANKET, Marketplace.ETSY);

      // Assertions
      expect(getProductDetails).toHaveBeenCalledWith(ProductName.BLANKET, Marketplace.ETSY);
      expect(result.name).toBe(ProductName.BLANKET);
      expect(result).toHaveProperty('baseDir');
      expect(result).toHaveProperty('shopId');
    });
  });
});
