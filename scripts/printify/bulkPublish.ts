import axios from 'axios';
import { PrintifyProductUploadRequestType } from '../../src/models/schemas/printify';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const printifyApiKey = process.env.PRINTIFY_API_KEY;
const printifyShopId = process.env.DARK_AURA_ETSY_SHOP_ID;

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

(async () => {
  try {
    const allProducts: ({
      id: string;
      is_deleted: boolean;
      visible: boolean;
    } & PrintifyProductUploadRequestType)[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      console.log('Fetching page', currentPage);
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

    const deskMatVariants = allProducts.map((product) => {
      if (
        product.blueprint_id ===
          Number(process.env.DESK_MAT_PRINTIFY_BLUEPRINT_ID) &&
        product.is_deleted === false &&
        product.visible === true
      ) {
        return {
          id: product.id,
          variants: product.variants,
        };
      }
    });

    // Add delay function
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // Calculate delay needed to stay within rate limit (200 requests per 30 minutes)
    const MIN_DELAY_MS = 30000; // 30 seconds between requests (30 minutes / 200 requests)

    // Convert filtered deskMatVariants to a mutable array we can pop from
    const publishQueue = deskMatVariants.filter(
      (product) => product !== undefined,
    );

    // Add starting index parameter (set to 221 to continue from where it left off)
    const REMAINING_PRODUCTS = 328;

    // Remove items we've already processed
    while (publishQueue.length > REMAINING_PRODUCTS) {
      publishQueue.pop();
    }

    while (publishQueue.length > 0) {
      const product = publishQueue.pop();
      if (!product) continue;

      console.log(
        `Publishing ${product.id} (${publishQueue.length} remaining)`,
      );

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

      await delay(MIN_DELAY_MS);
    }

    console.log('All products have been published!');
  } catch (error) {
    console.error(error);
  }
})();
