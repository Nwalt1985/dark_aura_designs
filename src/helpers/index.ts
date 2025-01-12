import fs from 'fs';
import path from 'path';
import { PromptResponseType } from '../models/schemas/prompt';
import { deleteListingByFileName, getUnlisted } from '../service/db';
import {
  deskMatDefaultDescription,
  pillowDefaultDescription,
  blanketDefaultDescription,
  wovenBlanketDefaultDescription,
} from '../handlers/generate-images/defaultDescription';
import { Marketplace, Product, ProductName } from '../models/types/listing';

export function getformattedDate() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;

  return formattedDate;
}

export function generateRandomNumber(): number {
  let randomNumber = Math.floor(Math.random() * 10000);
  if (randomNumber < 1000) {
    randomNumber += 1000;
  }
  return randomNumber;
}

export function getProductDetails(
  arg: string,
  marketplace: Marketplace,
): Product {
  let product: Product = {
    name: ProductName.DESK_MAT || ProductName.PILLOW,
    title: '',
    dimensions: '',
    baseDir: '',
    defaultDescription: '',
    rescale: '',
    shopId: '',
  };

  switch (arg) {
    case ProductName.DESK_MAT:
      product.name = ProductName.DESK_MAT;
      product.title = 'Desk Mat XL Mouse Matt';
      product.dimensions = '9450x4650';
      product.baseDir = path.resolve(
        process.env.HOME || '',
        `/volumes/Shop Assets/${marketplace}/dark_aura_designs/desk_mats`, // Upload to NAS device
      );
      product.defaultDescription = deskMatDefaultDescription;
      product.rescale = path.resolve(
        process.env.HOME || '',
        `Desktop/dark_aura_designs/rescale_desk_mats`,
      );
      product.shopId =
        marketplace === Marketplace.ETSY
          ? process.env.DARK_AURA_ETSY_SHOP_ID || ''
          : process.env.DARK_AURA_SHOPIFY_SHOP_ID || '';
      break;

    case ProductName.PILLOW:
      product.name = ProductName.PILLOW;
      product.title = 'Cushion';
      product.dimensions = '4050x4050';
      product.baseDir = path.resolve(
        process.env.HOME || '',
        `/volumes/Shop Assets/${marketplace}/dark_aura_designs/pillows`,
      );
      product.defaultDescription = pillowDefaultDescription;
      product.rescale = path.resolve(
        process.env.HOME || '',
        `Desktop/dark_aura_designs/rescale_pillows`,
      );
      product.shopId =
        marketplace === Marketplace.ETSY
          ? process.env.DARK_AURA_ETSY_SHOP_ID || ''
          : process.env.DARK_AURA_SHOPIFY_SHOP_ID || '';
      break;

    case ProductName.BLANKET:
      product.name = ProductName.BLANKET;
      product.title = 'Blanket';
      product.dimensions = '8228x6260';
      product.baseDir = path.resolve(
        process.env.HOME || '',
        `/volumes/Shop Assets/${marketplace}/dark_aura_designs/blankets`,
      );
      product.defaultDescription = blanketDefaultDescription;
      product.rescale = path.resolve(
        process.env.HOME || '',
        `Desktop/dark_aura_designs/rescale_blankets`,
      );
      product.shopId =
        marketplace === Marketplace.ETSY
          ? process.env.DARK_AURA_ETSY_SHOP_ID || ''
          : process.env.DARK_AURA_SHOPIFY_SHOP_ID || '';
      break;

    case ProductName.WOVEN_BLANKET:
      product.name = ProductName.WOVEN_BLANKET;
      product.title = 'Woven Blanket';
      product.dimensions = '7680x5760';
      product.baseDir = path.resolve(
        process.env.HOME || '',
        `/volumes/Shop Assets/${marketplace}/dark_aura_designs/woven_blankets`,
      );
      product.defaultDescription = wovenBlanketDefaultDescription;
      product.rescale = path.resolve(
        process.env.HOME || '',
        `Desktop/dark_aura_designs/rescale_woven_blankets`,
      );
      product.shopId =
        marketplace === Marketplace.ETSY
          ? process.env.DARK_AURA_ETSY_SHOP_ID || ''
          : process.env.DARK_AURA_SHOPIFY_SHOP_ID || '';
      break;
  }

  return product;
}

export function getGeneratedFileNames(
  dir: string,
  productType: string,
): string[] {
  const fileNameArray = assetFolder(dir);

  switch (productType) {
    case 'desk mat':
      return fileNameArray
        .filter((fileName) => {
          if (fileName.includes('-9450x4650')) {
            return fileName;
          }
        })
        .map((fileName) => fileName.replace('-9450x4650', ''));

    case 'pillow':
      return fileNameArray
        .filter((fileName) => {
          if (fileName.includes('-4050x4050')) {
            return fileName;
          }
        })
        .map((fileName) => fileName.replace('-4050x4050', ''));

    case 'blanket':
      return fileNameArray
        .filter((fileName) => {
          if (fileName.includes('-8228x6260')) {
            return fileName;
          }
        })
        .map((fileName) => fileName.replace('-8228x6260', ''));

    case 'woven':
      return fileNameArray
        .filter((fileName) => {
          if (fileName.includes('-7680x5760')) {
            return fileName;
          }
        })
        .map((fileName) => fileName.replace('-7680x5760', ''));
  }

  return [];
}

function assetFolder(directory: string): string[] {
  const fileArray: string[] = [];

  fs.readdirSync(directory).forEach((folder) => {
    if (folder.match(/\d{2}-\d{2}-\d{4}/)) {
      const folderPath = path.resolve(directory, folder);

      if (folderPath.includes('._')) {
        return;
      }

      fs.readdirSync(folderPath).forEach((file) => {
        if (file.includes('.DS_Store')) {
          return;
        }
        fileArray.push(file.replace('.jpg', ''));
      });
    }
  });

  return fileArray;
}

// Remove listings from the database that do not have a corresponding image file
export async function dbTidy(
  unlisted: PromptResponseType[],
  product: Product,
): Promise<PromptResponseType[]> {
  const unlistedFileNames = unlisted.map((listing) => {
    if (!listing.filename) {
      console.log('No filename found for listing', listing);
    }

    return listing.filename.replace(/(-\d+x\d+)?$/, '');
  });

  const generatedImagesFilenames = getGeneratedFileNames(
    product.baseDir,
    product.name,
  );

  for (const listing of unlistedFileNames) {
    if (!generatedImagesFilenames!.includes(listing)) {
      console.log(`Deleting ${listing} from the DB`);
      await deleteListingByFileName(listing);
    }
  }

  return await getUnlisted(product.name);
}

// Loop through the folders and subfolders in the original directory and return the buffer of the image
export async function getBuffer(
  fileName: string,
  baseDir: string,
): Promise<
  {
    filename: string;
    fileId: string | null;
    base64: Buffer;
  }[]
> {
  const buffer: {
    filename: string;
    fileId: string | null;
    base64: Buffer;
  }[] = [];

  fs.readdirSync(baseDir).forEach((dir) => {
    if (dir.includes('.DS_Store') || dir.includes('._')) {
      return;
    }

    if (dir.match(/\d{2}-\d{2}-\d{4}/)) {
      const folder = path.resolve(baseDir, dir);

      fs.readdirSync(folder).forEach((file) => {
        if (file.includes('.DS_Store') || file.includes('._')) {
          return;
        }

        const filePath = path.resolve(folder, file);

        if (file.includes(fileName)) {
          buffer.push({
            filename: file,
            fileId: extractImageId(file),
            base64: fs.readFileSync(filePath),
          });
        }
      });
    }
  });

  return buffer;
}

function extractImageId(filename: string): string | null {
  const regex = /\b\d{6}\b/;
  const match = filename.match(regex);
  return match![0] || null;
}

export async function relocateRescaleImage(product: Product, fileName: string) {
  const rescaleDir = product.rescale;
  const completedDir = path.resolve(rescaleDir, '../completed_rescale');

  // Create completed_rescale directory if it doesn't exist
  if (!fs.existsSync(completedDir)) {
    fs.mkdirSync(completedDir, { recursive: true });
  }

  const fileExtensions = ['.png', '.jpg'];

  fileExtensions.forEach((extension) => {
    const sourceFile = path.resolve(rescaleDir, `${fileName}${extension}`);
    const targetFile = path.resolve(completedDir, `${fileName}${extension}`);

    if (fs.existsSync(sourceFile)) {
      fs.renameSync(sourceFile, targetFile);
      console.log(
        `Moved ${fileName}${extension} to completed_rescale directory`,
      );
    }
  });
}

export async function createFile(
  baseDir: string,
  filename: string,
  resizedBuffer: Buffer,
): Promise<void> {
  const filePath = path.join(`${baseDir}`, `${filename}`);

  fs.writeFile(filePath, resizedBuffer.toString('base64'), 'base64', (err) => {
    if (err) {
      console.error(`Error writing file: ${err}`);
    } else {
      console.log(`${filename} written successfully.`);
    }
  });
}
