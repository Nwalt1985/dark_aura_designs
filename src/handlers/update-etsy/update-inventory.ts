import dotenv from 'dotenv';
import yargs from 'yargs';

import {
  getAllActiveListings,
  getListingInventory,
  updateListingInventory,
} from '../../service/etsy';
import { Logger } from '../../errors/logger';
import { hideBin } from 'yargs/helpers';
import { ProductName, VarSize } from '../../models/types/listing';
import { EtsyInventoryUpdateType } from '../../models/schemas/etsy';
dotenv.config();

const parser = yargs(hideBin(process.argv))
  .options({
    product: {
      type: 'string',
      description: 'Product type for the listing',
      choices: Object.values(ProductName),
      default: ProductName.DESK_MAT,
    },
    varSize: {
      type: 'string',
      description: 'Size of the product',
      choices: Object.values(VarSize),
      demandOption: true,
    },
    quantity: {
      type: 'number',
      description: 'Quantity of the product',
      demandOption: true,
    },
    limit: {
      type: 'number',
      description: 'Limit active listings (optional)',
      demandOption: false,
    },
  })
  .strict()
  .help();

void (async (): Promise<void> => {
  const argv = parser.parseSync();
  const shopId = process.env['ETSY_SHOP_ID'] as string;

  const activeListings = await getAllActiveListings(shopId, argv.limit);

  if (!activeListings || !Array.isArray(activeListings) || activeListings.length === 0) {
    Logger.info('No active listings found');
    return;
  }

  // get all listing IDs
  const listings = activeListings
    .filter((listing) => listing.title.includes('Desk Mat'))
    .map((listing) => ({
      listingId: listing.listing_id,
      title: listing.title,
    }));

  Logger.info(`Updating ${listings.length} listings`);

  for (const listing of listings) {
    const inventory = await getListingInventory(listing.listingId);
    const { products, price_on_property, quantity_on_property, sku_on_property } = inventory;

    const variantSize = {
      [VarSize.SMALL]: '14.4&quot; × 12.1&quot;',
      [VarSize.MEDIUM]: '23.6&quot; × 13.8&quot;',
      [VarSize.LARGE]: '31.5&quot; × 15.5&quot;',
    };

    const updateProduct = products.map((product) => {
      // update quantity on variant
      if (
        product.property_values.some((value) => value.values.includes(variantSize[argv.varSize]))
      ) {
        return {
          sku: product.sku,
          offerings: product.offerings.map((offering) => ({
            quantity: argv.quantity,
            is_enabled: offering.is_enabled,
            price: offering.price.amount / offering.price.divisor,
          })),
          property_values: product.property_values.map((value) => ({
            property_id: value.property_id,
            property_name: value.property_name,
            scale_id: value.scale_id,
            value_ids: value.value_ids,
            values: value.values,
          })),
        };
      }

      return {
        sku: product.sku,
        offerings: product.offerings.map((offering) => ({
          quantity: offering.quantity,
          is_enabled: offering.is_enabled,
          price: offering.price.amount / offering.price.divisor,
        })),
        property_values: product.property_values.map((value) => ({
          property_id: value.property_id,
          property_name: value.property_name,
          scale_id: value.scale_id,
          value_ids: value.value_ids,
          values: value.values,
        })),
      };
    });

    const data: EtsyInventoryUpdateType = {
      products: updateProduct,
      price_on_property,
      quantity_on_property,
      sku_on_property,
    };

    Logger.info(
      JSON.stringify({
        listingId: listing.listingId,
        title: listing.title.split('|')[0]?.trim(),
        size: argv.varSize,
      }),
    );

    await updateListingInventory(listing.listingId, data);
  }
})();
