import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import {
  PrintifyPaginatedResponse,
  PrintifyProductUploadRequestType,
} from '../../src/models/schemas/printify';
import { Logger, handleError, ExternalServiceError } from '../../src/errors';

dotenv.config();

const printifyApiKey = process.env['PRINTIFY_API_KEY'];
const printifyShopId = process.env['DARK_AURA_ETSY_SHOP_ID'];

if (!printifyApiKey || !printifyShopId) {
  throw new ExternalServiceError(
    'Missing required environment variables: PRINTIFY_API_KEY or PRINTIFY_SHOP_ID',
  );
}

// Add delay function
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

void (async (): Promise<void> => {
  try {
    const allProducts: ({
      id: string;
      is_deleted: boolean;
      visible: boolean;
    } & PrintifyProductUploadRequestType)[] = [];

    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      try {
        Logger.info(`Fetching page ${currentPage} of products`);

        const response = await axios.get(
          `https://api.printify.com/v1/shops/${printifyShopId}/products.json?page=${currentPage}&limit=50`,
          {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'NodeJS',
              Authorization: `Bearer ${printifyApiKey}`,
            },
          },
        );

        const responseData = response.data as PrintifyPaginatedResponse;
        Logger.info(`Retrieved ${responseData.data.length} products from page ${currentPage}`);

        allProducts.push(...responseData.data);

        hasMorePages = currentPage < responseData.last_page;
        currentPage++;
      } catch (error) {
        if (error instanceof AxiosError) {
          const handledError = handleError(error);

          Logger.error(handledError);

          if (error.response?.status === 429) {
            Logger.warn('Rate limit hit, waiting before retry...');
            await delay(60000); // Wait a minute before retrying
            // Don't increment currentPage, just continue to retry the same page
            continue;
          }
          throw new ExternalServiceError(`Failed to fetch page ${currentPage}`, error);
        }
        throw error;
      }
    }

    Logger.info(`Total products fetched: ${allProducts.length}`);

    const deskMatVariants = allProducts
      .map((product) => {
        if (
          product.blueprint_id === Number(process.env['DESK_MAT_PRINTIFY_BLUEPRINT_ID']) &&
          product.is_deleted === false &&
          product.visible === true
        ) {
          return {
            id: product.id,
            variants: product.variants,
          };
        }
        return null; // Return null for products that don't match criteria
      })
      .filter((product): product is { id: string; variants: any[] } => product !== null);

    // Calculate delay needed to stay within rate limit (200 requests per 30 minutes)
    const MIN_DELAY_MS = 30000; // 30 seconds between requests

    // Convert filtered deskMatVariants to a mutable array we can pop from
    const publishQueue = deskMatVariants.filter((product) => product !== null);
    Logger.info(`Found ${publishQueue.length} desk mats to process`);

    // Add starting index parameter (set to 221 to continue from where it left off)
    const REMAINING_PRODUCTS = 328;

    // Remove items we've already processed
    while (publishQueue.length > REMAINING_PRODUCTS) {
      publishQueue.pop();
    }

    let successCount = 0;
    let failureCount = 0;

    while (publishQueue.length > 0) {
      const product = publishQueue.pop();
      if (!product) {
        continue;
      }

      try {
        Logger.info(`Publishing product ${product.id} (${publishQueue.length} remaining)`);

        await axios.post(
          `https://api.printify.com/v1/shops/${printifyShopId}/products/${product.id}/publish.json`,
          {
            title: false,
            description: false,
            images: false,
            variants: true,
            tags: false,
            keyFeatures: false,
            shipping_template: false,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'NodeJS',
              Authorization: `Bearer ${printifyApiKey}`,
            },
          },
        );

        successCount++;
        Logger.info(`Successfully published product ${product.id}`);
        await delay(MIN_DELAY_MS);
      } catch (error) {
        failureCount++;
        if (error instanceof AxiosError) {
          const handledError = handleError(error);

          Logger.error(handledError);

          if (error.response?.status === 429) {
            Logger.warn('Rate limit hit, waiting before retry...');
            await delay(60000); // Wait a minute before retrying
            publishQueue.push(product); // Put the product back in the queue
            continue;
          }
        }

        const handledError = handleError(error);
        Logger.error(handledError);
      }
    }

    Logger.info(`Bulk publish completed. Success: ${successCount}, Failures: ${failureCount}`);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ExternalServiceError('Failed to publish products', error);
  }
})().catch((error: unknown) => {
  const handledError = handleError(error);
  Logger.error(handledError);
  process.exit(1);
});
