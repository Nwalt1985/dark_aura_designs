import axios from 'axios';
import { pingEtsy, getAllActiveListings, updateEtsyListing } from '../../service/etsy';
import { getEtsyAuthCredentials } from '../../service/db';
import { ExternalServiceError } from '../../errors';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock getEtsyAuthCredentials
jest.mock('../../service/db', () => ({
  getEtsyAuthCredentials: jest.fn(),
}));

// Mock error handling
jest.mock('../../errors', () => {
  const originalModule = jest.requireActual('../../errors');

  // Create custom ExternalServiceError for testing
  class MockExternalServiceError extends originalModule.ExternalServiceError {
    constructor(message: string, details?: unknown) {
      super(message, details);
    }
  }

  return {
    ...originalModule,
    ExternalServiceError: MockExternalServiceError,
    handleError: jest.fn().mockImplementation((error) => {
      if (error instanceof Error) {
        return error;
      }
      if (error && typeof error === 'object' && 'response' in error) {
        if (error.response && typeof error.response === 'object' && 'config' in error.response) {
          interface ErrorResponseWithConfig {
            config: { url?: string };
          }
          const url = (error.response as ErrorResponseWithConfig).config?.url || '';
          if (url.includes('openapi-ping')) {
            return new MockExternalServiceError('Failed to ping Etsy API', error);
          } else if (url.includes('listings/active')) {
            return new MockExternalServiceError('Failed to fetch Etsy listings', error);
          } else if (url.includes('listings/')) {
            return new MockExternalServiceError(
              `Failed to update Etsy listing: Test Listing`,
              error,
            );
          }
        }
        return new MockExternalServiceError('API Error', error);
      }
      return new MockExternalServiceError('Unknown error', error);
    }),
    Logger: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
  };
});

// Mock environment variables
process.env['ETSY_API_KEY'] = 'test-api-key';
process.env['ETSY_KEY_STRING'] = 'test-key-string';

describe('Etsy Service Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pingEtsy', () => {
    it('should successfully ping the Etsy API', async () => {
      const mockResponse = {
        data: {
          application_id: 123,
          ping: 'pong',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await pingEtsy();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://openapi.etsy.com/v3/application/openapi-ping',
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'NodeJS',
            'x-api-key': 'test-api-key',
          },
        },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw ExternalServiceError when Etsy API returns an error', async () => {
      const errorResponse = {
        response: {
          data: {
            error: 'API Error',
          },
          config: {
            url: 'https://openapi.etsy.com/v3/application/openapi-ping',
          },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(errorResponse);

      try {
        await pingEtsy();
        fail('Expected pingEtsy to throw an error');
      } catch (error: unknown) {
        if (error instanceof ExternalServiceError) {
          expect(error.message).toContain('Failed to ping Etsy API');
        } else {
          fail('Expected error to be an instance of ExternalServiceError');
        }
      }
    });
  });

  describe('getAllActiveListings', () => {
    it('should retrieve active listings from Etsy API', async () => {
      const mockListings = [
        { listing_id: 1, title: 'Test Listing 1', tags: [] },
        { listing_id: 2, title: 'Test Listing 2', tags: [] },
      ];

      const mockResponse = {
        data: {
          results: mockListings,
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await getAllActiveListings('test-shop-id');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.etsy.com/v3/application/shops/test-shop-id/listings/active',
        {
          headers: {
            'x-api-key': 'test-key-string',
          },
        },
      );
      expect(result).toEqual(mockListings);
    });

    it('should handle limit parameter correctly', async () => {
      const mockListings = [{ listing_id: 1, title: 'Test Listing', tags: [] }];
      const mockResponse = {
        data: {
          results: mockListings,
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await getAllActiveListings('test-shop-id', 10);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.etsy.com/v3/application/shops/test-shop-id/listings/active?limit=10',
        {
          headers: {
            'x-api-key': 'test-key-string',
          },
        },
      );
    });

    it('should handle different response structures', async () => {
      // Test array response
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ listing_id: 1, title: 'Test Listing', tags: [] }],
      });
      let result = await getAllActiveListings('test-shop-id');
      expect(result).toHaveLength(1);

      // Test results property
      mockedAxios.get.mockResolvedValueOnce({
        data: { results: [{ listing_id: 2, title: 'Test Listing 2', tags: [] }] },
      });
      result = await getAllActiveListings('test-shop-id');
      expect(result).toHaveLength(1);

      // Test listings property
      mockedAxios.get.mockResolvedValueOnce({
        data: { listings: [{ listing_id: 3, title: 'Test Listing 3', tags: [] }] },
      });
      result = await getAllActiveListings('test-shop-id');
      expect(result).toHaveLength(1);

      // Test count and results properties
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          count: 1,
          results: [{ listing_id: 4, title: 'Test Listing 4', tags: [] }],
        },
      });
      result = await getAllActiveListings('test-shop-id');
      expect(result).toHaveLength(1);

      // Test array-like object
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          '0': { listing_id: 5, title: 'Test Listing 5', tags: [] },
          '1': { listing_id: 6, title: 'Test Listing 6', tags: [] },
        },
      });
      result = await getAllActiveListings('test-shop-id');
      expect(result).toHaveLength(2);
    });

    it('should return empty array when response structure is unknown', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { unknown: 'structure' },
      });

      const result = await getAllActiveListings('test-shop-id');
      expect(result).toEqual([]);
    });

    it('should throw ExternalServiceError when Etsy API returns an error', async () => {
      const errorResponse = {
        response: {
          data: {
            error: 'API Error',
          },
          config: {
            url: 'https://api.etsy.com/v3/application/shops/test-shop-id/listings/active',
          },
        },
      };

      mockedAxios.get.mockRejectedValueOnce(errorResponse);

      try {
        await getAllActiveListings('test-shop-id');
        fail('Expected getAllActiveListings to throw an error');
      } catch (error: unknown) {
        if (error instanceof ExternalServiceError) {
          expect(error.message).toContain('Failed to fetch Etsy listings');
        } else {
          fail('Expected error to be an instance of ExternalServiceError');
        }
      }
    });
  });

  describe('updateEtsyListing', () => {
    it('should update an Etsy listing successfully', async () => {
      const mockAccessToken = 'test-access-token';
      (getEtsyAuthCredentials as jest.Mock).mockResolvedValueOnce(mockAccessToken);

      mockedAxios.request.mockResolvedValueOnce({ data: { success: true } });

      await updateEtsyListing('test-shop-id', 123, 'Test Listing', 'test-data');

      expect(getEtsyAuthCredentials).toHaveBeenCalled();
      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: 'https://openapi.etsy.com/v3/application/shops/test-shop-id/listings/123',
        data: 'test-data',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-api-key': 'test-key-string',
          authorization: `Bearer ${mockAccessToken}`,
        },
      });
    });

    it('should throw ExternalServiceError when Etsy API returns an error', async () => {
      (getEtsyAuthCredentials as jest.Mock).mockResolvedValueOnce('test-access-token');

      const errorResponse = {
        response: {
          data: {
            error: 'API Error',
          },
          config: {
            url: 'https://openapi.etsy.com/v3/application/shops/test-shop-id/listings/123',
          },
        },
      };

      mockedAxios.request.mockRejectedValueOnce(errorResponse);

      try {
        await updateEtsyListing('test-shop-id', 123, 'Test Listing', 'test-data');
        fail('Expected updateEtsyListing to throw an error');
      } catch (error: unknown) {
        if (error instanceof ExternalServiceError) {
          expect(error.message).toContain('Failed to update Etsy listing: Test Listing');
        } else {
          fail('Expected error to be an instance of ExternalServiceError');
        }
      }
    });
  });
});
