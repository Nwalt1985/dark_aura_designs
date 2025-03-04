/**
 * Product Configuration Module
 *
 * This module provides utility functions for product configuration and details.
 */
import path from 'path';
import { Marketplace, Product, ProductName } from '../models/types/listing';
import {
  deskMatDefaultDescription,
  pillowDefaultDescription,
  blanketDefaultDescription,
  wovenBlanketDefaultDescription,
} from '../handlers/generate-images/defaultDescription';

/**
 * Returns product configuration details based on product type and marketplace.
 *
 * This function provides all necessary configuration for a specific product type,
 * including file paths, dimensions, descriptions, and shop IDs.
 *
 * @param {ProductName} arg - The type of product to get details for
 * @param {Marketplace} marketplace - The marketplace (e.g., Etsy, Shopify)
 * @returns {Product} Complete product configuration object
 */
export function getProductDetails(arg: ProductName, marketplace: Marketplace): Product {
  const product: Product = {
    name:
      ProductName.DESK_MAT ||
      ProductName.PILLOW ||
      ProductName.BLANKET ||
      ProductName.WOVEN_BLANKET,
    title: '',
    dimensions: '',
    baseDir: '',
    defaultDescription: '',
    rescale: '',
    shopId: '',
    completedRescalePath: '',
  };

  switch (arg) {
    case ProductName.DESK_MAT:
      product.name = ProductName.DESK_MAT;
      product.title = 'Desk Mat XL Mouse Matt';
      product.dimensions = '9450x4650';
      product.baseDir = path.resolve(
        process.env['HOME'] || '',
        `/volumes/Shop Assets/${marketplace}/dark_aura_designs/desk_mats`, // Upload to NAS device
        // `Desktop/assets/${marketplace}/deskMats`,
      );
      product.defaultDescription = deskMatDefaultDescription;
      product.rescale = path.resolve(
        process.env['HOME'] || '',
        `Desktop/dark_aura_designs/rescale_desk_mats`,
      );
      product.completedRescalePath = path.resolve(
        process.env['HOME'] || '',
        `Desktop/dark_aura_designs/completed_desk_mats`,
      );
      product.shopId =
        marketplace === Marketplace.ETSY
          ? process.env['DARK_AURA_ETSY_SHOP_ID'] || ''
          : process.env['DARK_AURA_SHOPIFY_SHOP_ID'] || '';
      break;

    case ProductName.PILLOW:
      product.name = ProductName.PILLOW;
      product.title = 'Cushion';
      product.dimensions = '4050x4050';
      product.baseDir = path.resolve(
        process.env['HOME'] || '',
        `/volumes/Shop Assets/${marketplace}/dark_aura_designs/pillows`,
        // `Desktop/assets/${marketplace}/pillows`,
      );
      product.defaultDescription = pillowDefaultDescription;
      product.rescale = path.resolve(
        process.env['HOME'] || '',
        `Desktop/dark_aura_designs/rescale_pillows`,
      );
      product.completedRescalePath = path.resolve(
        process.env['HOME'] || '',
        `Desktop/dark_aura_designs/completed_pillows`,
      );
      product.shopId =
        marketplace === Marketplace.ETSY
          ? process.env['DARK_AURA_ETSY_SHOP_ID'] || ''
          : process.env['DARK_AURA_SHOPIFY_SHOP_ID'] || '';
      break;

    case ProductName.BLANKET:
      product.name = ProductName.BLANKET;
      product.title = 'Blanket';
      product.dimensions = '8228x6260';
      product.baseDir = path.resolve(
        process.env['HOME'] || '',
        `/volumes/Shop Assets/${marketplace}/dark_aura_designs/blankets`,
        // `Desktop/assets/${marketplace}/blankets`,
      );
      product.defaultDescription = blanketDefaultDescription;
      product.rescale = path.resolve(
        process.env['HOME'] || '',
        `Desktop/dark_aura_designs/rescale_blankets`,
      );
      product.completedRescalePath = path.resolve(
        process.env['HOME'] || '',
        `Desktop/dark_aura_designs/completed_blankets`,
      );
      product.shopId =
        marketplace === Marketplace.ETSY
          ? process.env['DARK_AURA_ETSY_SHOP_ID'] || ''
          : process.env['DARK_AURA_SHOPIFY_SHOP_ID'] || '';
      break;

    case ProductName.WOVEN_BLANKET:
      product.name = ProductName.WOVEN_BLANKET;
      product.title = 'Woven Blanket';
      product.dimensions = '7680x5760';
      product.baseDir = path.resolve(
        process.env['HOME'] || '',
        `/volumes/Shop Assets/${marketplace}/dark_aura_designs/woven_blankets`,
        // `Desktop/assets/${marketplace}/wovenBlankets`,
      );
      product.defaultDescription = wovenBlanketDefaultDescription;
      product.rescale = path.resolve(
        process.env['HOME'] || '',
        `Desktop/dark_aura_designs/rescale_woven_blankets`,
      );
      product.completedRescalePath = path.resolve(
        process.env['HOME'] || '',
        `Desktop/dark_aura_designs/completed_woven_blankets`,
      );
      product.shopId =
        marketplace === Marketplace.ETSY
          ? process.env['DARK_AURA_ETSY_SHOP_ID'] || ''
          : process.env['DARK_AURA_SHOPIFY_SHOP_ID'] || '';
      break;
  }

  return product;
}

/**
 * Retrieves filenames of generated product images from the specified directory.
 * Filters files based on product type and removes dimension information from filenames.
 *
 * @param {string} dir - Directory path to search for files
 * @param {ProductName} productType - Type of product to filter files for
 * @returns {string[]} Array of filtered filenames without dimension information
 */
export function getGeneratedFileNames(dir: string, productType: ProductName): string[] {
  const fileNameArray = assetFolder(dir);

  switch (productType) {
    case ProductName.DESK_MAT:
      return fileNameArray
        .filter((fileName) => fileName.includes('-9450x4650'))
        .map((fileName) => fileName.replace('-9450x4650', ''));

    case ProductName.PILLOW:
      return fileNameArray
        .filter((fileName) => fileName.includes('-4050x4050'))
        .map((fileName) => fileName.replace('-4050x4050', ''));

    case ProductName.BLANKET:
      return fileNameArray
        .filter((fileName) => fileName.includes('-8228x6260') || fileName.includes('-6260x8228'))
        .map((fileName) =>
          fileName.includes('-8228x6260')
            ? fileName.replace('-8228x6260', '')
            : fileName.replace('-6260x8228', ''),
        );

    case ProductName.WOVEN_BLANKET:
      return fileNameArray
        .filter((fileName) => fileName.includes('-7680x5760') || fileName.includes('-5760x7680'))
        .map((fileName) =>
          fileName.includes('-7680x5760')
            ? fileName.replace('-7680x5760', '')
            : fileName.replace('-5760x7680', ''),
        );
  }

  return [];
}

/**
 * Recursively scans a directory for image files in date-formatted subfolders.
 * Collects filenames from folders matching the date pattern (DD-MM-YYYY).
 * Skips hidden files and system files like .DS_Store.
 *
 * @param {string} directory - Root directory to scan
 * @returns {string[]} Array of filenames without file extensions
 * @private
 */
function assetFolder(directory: string): string[] {
  const fileArray: string[] = [];
  const fs = require('fs');
  const path = require('path');

  fs.readdirSync(directory).forEach((folder: string) => {
    if (folder.match(/\d{2}-\d{2}-\d{4}/)) {
      const folderPath = path.resolve(directory, folder);

      if (folderPath.includes('._')) {
        return;
      }

      fs.readdirSync(folderPath).forEach((file: string) => {
        if (file.includes('.DS_Store') || file.includes('._')) {
          return;
        }
        fileArray.push(file.replace('.jpg', ''));
      });
    }
  });

  return fileArray;
}
