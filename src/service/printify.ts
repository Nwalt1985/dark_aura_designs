/**
 * Printify Service Module
 *
 * This module provides functions for interacting with the Printify API.
 * It includes operations for uploading images, retrieving uploaded images,
 * and creating new products on Printify.
 *
 * All API calls are wrapped in a utility function that provides
 * consistent error handling and logging.
 */
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  PrintifyImageResponseType,
  PrintifyGetUploadsResponseType,
  PrintifyProductUploadRequestType,
  PrintifyProductUploadResponseType,
  PrintifyProductUploadRequest,
} from '../models/schemas/printify';
import dotenv from 'dotenv';
import { ExternalServiceError, handleError, Logger } from '../errors';

dotenv.config();

const printifyApiKey = process.env['PRINTIFY_API_KEY'] || '';

/**
 * Default headers for Printify API calls
 */
const defaultHeaders = {
  'Content-Type': 'application/json',
  'User-Agent': 'NodeJS',
  Authorization: `Bearer ${printifyApiKey}`,
};

/**
 * Utility function to make Printify API calls with consistent error handling
 * @param method HTTP method
 * @param url API endpoint
 * @param data Request body (for POST/PUT/PATCH)
 * @param errorMessage Error message to use if the call fails
 * @returns Result of the API call
 */
async function executePrintifyApiCall<T>(
  method: string,
  url: string,
  data?: unknown,
  errorMessage = 'Printify API error',
): Promise<T> {
  try {
    const config: AxiosRequestConfig = {
      method,
      url,
      headers: defaultHeaders,
      data,
    };

    const response: AxiosResponse<T> = await axios(config);
    return response.data;
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ExternalServiceError(errorMessage, error);
  }
}

/**
 * Uploads an image to Printify
 *
 * @param buffer - The image buffer to upload
 * @param filename - The name of the file being uploaded
 * @returns The Printify image response containing the image ID and URL
 * @throws ExternalServiceError if the API call fails
 */
export async function uploadImages(
  buffer: Buffer,
  filename: string,
): Promise<PrintifyImageResponseType> {
  return executePrintifyApiCall<PrintifyImageResponseType>(
    'post',
    'https://api.printify.com/v1/uploads/images.json',
    {
      file_name: filename,
      contents: buffer.toString('base64'),
    },
    'Failed to upload image to Printify',
  );
}

/**
 * Retrieves all uploaded images from Printify
 *
 * @returns Object containing the array of image data, length, and total images count
 * @throws ExternalServiceError if the API call fails
 */
export async function getUploadedImages(): Promise<{
  imageData: PrintifyImageResponseType[];
  length: number;
  totalImages: number;
}> {
  const imageData: PrintifyImageResponseType[] = [];

  const data = await executePrintifyApiCall<PrintifyGetUploadsResponseType>(
    'get',
    'https://api.printify.com/v1/uploads.json',
    undefined,
    'Failed to get uploaded images from Printify',
  );

  imageData.push(...data.data);

  if (data.to > 1) {
    const pages = data.to;

    for (let i = 2; i <= pages; i++) {
      const nextPage = await executePrintifyApiCall<PrintifyGetUploadsResponseType>(
        'get',
        `https://api.printify.com/v1/uploads.json?page=${i}`,
        undefined,
        `Failed to get uploaded images from Printify (page ${i})`,
      );

      imageData.push(...nextPage.data);
    }
  }

  return { imageData, length: imageData.length, totalImages: data.total };
}

/**
 * Creates a new product on Printify
 *
 * @param productData - The product data to create
 * @param shopId - The Printify shop ID
 * @returns The Printify product upload response
 * @throws ExternalServiceError if the API call fails
 */
export async function createNewProduct(
  productData: PrintifyProductUploadRequestType,
  shopId: string,
): Promise<PrintifyProductUploadResponseType> {
  // Validate the product data
  PrintifyProductUploadRequest.parse(productData);

  return executePrintifyApiCall<PrintifyProductUploadResponseType>(
    'post',
    `https://api.printify.com/v1/shops/${shopId}/products.json`,
    productData,
    'Failed to create new product on Printify',
  );
}
