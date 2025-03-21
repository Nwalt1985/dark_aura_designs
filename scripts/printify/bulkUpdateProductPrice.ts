import axios from 'axios';
import { PrintifyProductUploadRequestType } from '../../src/models/schemas/printify';
import dotenv from 'dotenv';
import path from 'path';
import { Logger } from 'src/errors/logger';
import { ErrorType } from 'src/errors/CustomError';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const printifyApiKey = process.env['PRINTIFY_API_KEY'];
const printifyShopId = process.env['DARK_AURA_ETSY_SHOP_ID'];

interface PrintifyPaginatedResponse {
  current_page: number;
  data: ({
    id: string;
    is_deleted: boolean;
    visible: boolean;
  } & PrintifyProductUploadRequestType)[];
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
}

(async (): Promise<void> => {
  try {
    const allProducts: ({
      id: string;
      is_deleted: boolean;
      visible: boolean;
    } & PrintifyProductUploadRequestType)[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      Logger.info(`Fetching page ${currentPage}`);
      const { data } = await axios.get<PrintifyPaginatedResponse>(
        `https://api.printify.com/v1/shops/${printifyShopId}/products.json?page=${currentPage}&limit=50`,
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'NodeJS',
            Authorization: `Bearer ${printifyApiKey}`,
          },
        },
      );

      allProducts.push(...data.data);

      hasMorePages = currentPage < data.last_page;
      currentPage++;
    }

    const deskMatVariants = allProducts
      .map((product) => {
        if (
          product.blueprint_id === Number(process.env['DESK_MAT_PRINTIFY_BLUEPRINT_ID']) && // <---- change to product blueprint id env variable
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

    // Add delay function
    const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

    // Calculate delay needed to stay within rate limit (200 requests per 30 minutes)
    const MIN_DELAY_MS = 30000; // 30 seconds between requests (30 minutes / 200 requests)

    for (const product of deskMatVariants) {
      if (!product) {
        continue;
      }

      Logger.info(`Updating ${product.id}`);

      for (const variant of product.variants) {
        if (variant.title === '31.5" × 15.5"') {
          variant.price = 3800;
        } else if (variant.title === '23.6" × 13.8"') {
          variant.price = 3200;
        } else if (variant.title === '14.4" × 12.1"') {
          variant.price = 2500;
        }
      }

      await axios.put(
        `https://api.printify.com/v1/shops/${printifyShopId}/products/${product.id}.json`,
        {
          variants: product.variants,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'NodeJS',
            Authorization: `Bearer ${printifyApiKey}`,
          },
        },
      );

      // Add delay between requests
      Logger.info(`Waiting 30 seconds before next request...`);
      await delay(MIN_DELAY_MS);
    }
  } catch (error) {
    Logger.error({
      type: ErrorType.EXTERNAL_SERVICE,
      code: 500,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      details: error,
    });
    process.exit(1);
  }
})().catch((error) => {
  Logger.error({
    type: ErrorType.INTERNAL,
    code: 500,
    message: `Unhandled error: ${error instanceof Error ? error.message : String(error)}`,
    details: error,
  });
  process.exit(1);
});
