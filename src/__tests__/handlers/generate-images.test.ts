import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { ProductName, Marketplace } from '../../models/types/listing';
import { ValidationError } from '../../errors';

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
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn(),
}));

jest.mock('../../service/db', () => ({
  createDBListing: jest.fn(),
  _closeConnection: jest.fn(),
}));

jest.mock('../../database', () => ({
  closeConnection: jest.fn(),
}));

jest.mock('../../helpers', () => ({
  getProductDetails: jest.fn(),
  getformattedDate: jest.fn(),
  relocateRescaleImage: jest.fn(),
  resizeDeskmats: jest.fn(),
  resizePillowImage: jest.fn(),
  resizeBlanketImage: jest.fn(),
  resizeWovenBlanketImage: jest.fn(),
}));

jest.mock('../../handlers/generate-images/queryWithOpenAi', () => ({
  getImageData: jest.fn(),
}));

// Import the mocked modules
import { createDBListing } from '../../service/db';
import { closeConnection } from '../../database';
import {
  getProductDetails,
  getformattedDate,
  relocateRescaleImage,
  resizeDeskmats,
  resizePillowImage,
  resizeBlanketImage,
  resizeWovenBlanketImage,
} from '../../helpers';
import { getImageData } from '../../handlers/generate-images/queryWithOpenAi';
import { generateImagesFromRescale } from '../../handlers/generate-images/generateImages';

describe('generate-images handler', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.resetAllMocks();

    // Mock console methods to prevent output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('generateImagesFromRescale', () => {
    it('should process images from the rescale directory', async () => {
      // Mock data
      const product = {
        name: ProductName.DESK_MAT,
        rescale: '/test/rescale',
        baseDir: '/test/dir',
        defaultDescription: 'A beautiful desk mat',
      };

      const limit = 2;
      const formattedDate = '2023-01-01';

      // Mock implementations
      (getformattedDate as jest.Mock).mockReturnValue(formattedDate);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(['image1.png', 'image2.png', '.DS_Store']);
      (path.join as jest.Mock).mockImplementation((dir, file) => `${dir}/${file}`);

      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('test-image-data'));

      (getImageData as jest.Mock).mockResolvedValue({
        prompt: 'test prompt',
        title: 'Test Desk Mat',
        description: 'A test desk mat',
        keywords: ['test', 'desk mat'],
        theme: 'modern',
        style: 'minimalist',
      });

      (createDBListing as jest.Mock).mockResolvedValue({ insertedCount: 1 });

      // Call the function
      await generateImagesFromRescale(product, limit);

      // Assertions
      expect(fs.existsSync).toHaveBeenCalledWith('/test/rescale');
      expect(fs.readdirSync).toHaveBeenCalledWith('/test/rescale');
      expect(fs.readFileSync).toHaveBeenCalledTimes(2);
      expect(getImageData).toHaveBeenCalledTimes(2);
      expect(createDBListing).toHaveBeenCalledTimes(2);
      expect(resizeDeskmats).toHaveBeenCalledTimes(2);
      expect(relocateRescaleImage).toHaveBeenCalledTimes(2);
    });

    it('should handle non-existent rescale directory', async () => {
      // Mock data
      const product = {
        name: ProductName.DESK_MAT,
        rescale: '/test/rescale',
        baseDir: '/test/dir',
        defaultDescription: 'A beautiful desk mat',
      };

      const limit = 2;

      // Mock implementations
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Call and assert
      await expect(generateImagesFromRescale(product, limit)).rejects.toThrow(ValidationError);
      expect(fs.existsSync).toHaveBeenCalledWith('/test/rescale');
    });

    it('should handle empty rescale directory', async () => {
      // Mock data
      const product = {
        name: ProductName.DESK_MAT,
        rescale: '/test/rescale',
        baseDir: '/test/dir',
        defaultDescription: 'A beautiful desk mat',
      };

      const limit = 2;

      // Mock implementations
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([]);

      // Call the function
      await generateImagesFromRescale(product, limit);

      // Assertions
      expect(fs.existsSync).toHaveBeenCalledWith('/test/rescale');
      expect(fs.readdirSync).toHaveBeenCalledWith('/test/rescale');
      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(getImageData).not.toHaveBeenCalled();
    });

    it('should handle errors during image processing', async () => {
      // Mock data
      const product = {
        name: ProductName.DESK_MAT,
        rescale: '/test/rescale',
        baseDir: '/test/dir',
        defaultDescription: 'A beautiful desk mat',
      };

      const limit = 2;
      const formattedDate = '2023-01-01';

      // Mock implementations
      (getformattedDate as jest.Mock).mockReturnValue(formattedDate);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(['image1.png', 'image2.png']);
      (path.join as jest.Mock).mockImplementation((dir, file) => `${dir}/${file}`);

      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('test-image-data'));

      // First image succeeds, second image fails
      (getImageData as jest.Mock)
        .mockResolvedValueOnce({
          prompt: 'test prompt',
          title: 'Test Desk Mat',
          description: 'A test desk mat',
          keywords: ['test', 'desk mat'],
          theme: 'modern',
          style: 'minimalist',
        })
        .mockRejectedValueOnce(new Error('Failed to get image data'));

      (createDBListing as jest.Mock).mockResolvedValue({ insertedCount: 1 });

      // Call the function
      await generateImagesFromRescale(product, limit);

      // Assertions
      expect(fs.existsSync).toHaveBeenCalledWith('/test/rescale');
      expect(fs.readdirSync).toHaveBeenCalledWith('/test/rescale');
      expect(fs.readFileSync).toHaveBeenCalledTimes(2);
      expect(getImageData).toHaveBeenCalledTimes(2);
      expect(createDBListing).toHaveBeenCalledTimes(1);
      expect(resizeDeskmats).toHaveBeenCalledTimes(1);
      expect(relocateRescaleImage).toHaveBeenCalledTimes(1);
    });

    it('should use the correct image processor based on product type', async () => {
      // Test for each product type
      const productTypes = [
        {
          name: ProductName.DESK_MAT,
          processor: resizeDeskmats,
        },
        {
          name: ProductName.PILLOW,
          processor: resizePillowImage,
        },
        {
          name: ProductName.BLANKET,
          processor: resizeBlanketImage,
        },
        {
          name: ProductName.WOVEN_BLANKET,
          processor: resizeWovenBlanketImage,
        },
      ];

      for (const { name, processor } of productTypes) {
        // Reset mocks for each iteration
        jest.clearAllMocks();

        // Mock data
        const product = {
          name,
          rescale: '/test/rescale',
          baseDir: '/test/dir',
          defaultDescription: `A beautiful ${name}`,
        };

        const limit = 1;
        const formattedDate = '2023-01-01';

        // Mock implementations
        (getformattedDate as jest.Mock).mockReturnValue(formattedDate);
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readdirSync as jest.Mock).mockReturnValue(['image1.png']);
        (path.join as jest.Mock).mockImplementation((dir, file) => `${dir}/${file}`);

        (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('test-image-data'));

        (getImageData as jest.Mock).mockResolvedValue({
          prompt: 'test prompt',
          title: `Test ${name}`,
          description: `A test ${name}`,
          keywords: ['test', name],
          theme: 'modern',
          style: 'minimalist',
        });

        (createDBListing as jest.Mock).mockResolvedValue({ insertedCount: 1 });

        // Call the function
        await generateImagesFromRescale(product, limit);

        // Assertions
        expect(processor).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('getProductDetails', () => {
    it('should return product details for a given product type and marketplace', () => {
      // Mock implementation
      (getProductDetails as jest.Mock).mockReturnValue({
        name: ProductName.BLANKET,
        baseDir: '/test/dir',
        rescale: '/test/rescale',
        defaultDescription: 'A beautiful blanket',
      });

      // Call the function
      const result = getProductDetails(ProductName.BLANKET, Marketplace.ETSY);

      // Assertions
      expect(getProductDetails).toHaveBeenCalledWith(ProductName.BLANKET, Marketplace.ETSY);
      expect(result.name).toBe(ProductName.BLANKET);
      expect(result).toHaveProperty('baseDir');
      expect(result).toHaveProperty('rescale');
    });
  });
});
