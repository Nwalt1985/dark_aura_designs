import fs from 'fs';
import path from 'path';
import { PromptResponseType } from '../models/schemas/prompt';
import {
  createDBListing,
  deleteListingByFileName,
  getUnlisted,
} from '../service/db';
import sharp from 'sharp';
import {
  deskMatDefaultDescription,
  laptopSleeveDefaultDescription,
  lunchBagDefaultDescription,
} from '../handlers/generate-images/defaultDescription';
import {
  Product,
  ProductName,
  BuildProductType,
} from '../models/types/listing';
import { getImageData } from '../handlers/generate-images/queryWithOpenAi';

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

export function getProductDetails(arg: string): Product {
  let product: Product = {
    name: ProductName.DESK_MAT || ProductName.LAPTOP_SLEEVE,
    title: '',
    dimensions: '',
    baseDir: '',
    defaultDescription: '',
    rescale: '',
  };

  switch (arg) {
    case BuildProductType.DESK_MAT:
      product.name = ProductName.DESK_MAT;
      product.title = 'Desk Mat XL Mouse Matt';
      product.dimensions = '9450x4650';
      product.baseDir = path.resolve(
        process.env.HOME || '',
        `Desktop/ai_etsy/etsy_assets/desk_mats`,
      );
      product.defaultDescription = deskMatDefaultDescription;
      product.rescale = path.resolve(
		process.env.HOME || '',
        `Desktop/ai_etsy/etsy_assets/desk_mats/rescale`,
      );
      break;
    case BuildProductType.LAPTOP_SLEEVE:
      product.name = ProductName.LAPTOP_SLEEVE;
      product.title = 'Laptop Sleeve Computer';
      product.dimensions = '4125x3000';
      product.baseDir = path.resolve(
        process.env.HOME || '',
        `Desktop/ai_etsy/etsy_assets/laptop_sleeves`,
      );
      product.defaultDescription = laptopSleeveDefaultDescription;
      break;
    case BuildProductType.LUNCH_BAG:
      product.name = ProductName.LUNCH_BAG;
      product.title = 'Lunch Bag';
      product.dimensions = '1568x1214';
      product.baseDir = path.resolve(
        process.env.HOME || '',
        `Desktop/ai_etsy/etsy_assets/lunch_bags`,
      );
      product.defaultDescription = lunchBagDefaultDescription;
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

    case 'laptop sleeve':
      return fileNameArray
        .filter((fileName) => {
          if (fileName.includes('-4125x3000')) {
            return fileName;
          }
        })
        .map((fileName) => fileName.replace('-4125x3000', ''));

    case 'lunch bag':
      return fileNameArray
        .filter((fileName) => {
          if (fileName.includes('-1401x1085')) {
            return fileName;
          }
        })
        .map((fileName) => fileName.replace('-1401x1085', ''));
  }

  return [];
}

export async function getMockups(): Promise<string[]> {
  const mockupDir = path.resolve(
    process.env.HOME || '',
    `Desktop/ai_etsy/etsy_assets/mock_ups`,
  );

  const mockupsArray = assetFolder(mockupDir);

  return mockupsArray;
}

function assetFolder(directory: string): string[] {
  const fileArray: string[] = [];

  fs.readdirSync(directory).forEach((folder) => {
    if (folder.match(/\d{2}-\d{2}-\d{4}/)) {
      const folderPath = path.resolve(directory, folder);

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
    if (dir.match(/\d{2}-\d{2}-\d{4}/)) {
      const folder = path.resolve(baseDir, dir);

      fs.readdirSync(folder).forEach((file) => {
        if (file.includes('.DS_Store')) {
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
  const regex = /\b\d{4}\b/;
  const match = filename.match(regex);
  return match![0] || null;
}

export async function removeRescaleImage(fileName: string) {
  const rescaleDir = path.resolve(
    process.env.HOME || '',
    `Desktop/ai_etsy/etsy_assets/desk_mats/rescale`,
  );

  const fileExtensions = ['.png', '.jpg'];

  fileExtensions.forEach((extension) => {
    const filePathWithExtension = path.resolve(
      rescaleDir,
      `${fileName}${extension}`,
    );

    if (fs.existsSync(filePathWithExtension)) {
      fs.unlinkSync(filePathWithExtension);
      console.log(`Removed rescale image: ${fileName}${extension}`);
    }
  });
}

export async function resizeDeskmats(
  buffer: string,
  filename: string,
  fileId: number,
  baseDir: string,
  formattedDate: string,
): Promise<void> {
  const directoryPath = `${baseDir}/${formattedDate}`;

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  const mockup = await sharp(Buffer.from(buffer, 'base64'))
    .resize(2543, 1254)
    .jpeg()
    .toBuffer();

  await createFile(
    directoryPath,
    `${filename}-${fileId}-mockup-2543x1254.jpg`,
    mockup,
  );

  const image1 = await sharp(Buffer.from(buffer, 'base64'))
    .resize(4320, 3630)
    .jpeg()
    .toBuffer();

  await createFile(
    directoryPath,
    `${filename}-${fileId}-4320x3630.jpg`,
    image1,
  );

  const image2 = await sharp(Buffer.from(buffer, 'base64'))
    .resize(7080, 4140)
    .jpeg()
    .toBuffer();

  await createFile(
    directoryPath,
    `${filename}-${fileId}-7080x4140.jpg`,
    image2,
  );

  const image3 = await sharp(Buffer.from(buffer, 'base64'))
    .resize(9450, 4650)
    .jpeg()
    .toBuffer();

  await createFile(
    directoryPath,
    `${filename}-${fileId}-9450x4650.jpg`,
    image3,
  );
}

export async function resizeLaptopSleeve(
  buffer: string,
  filename: string,
  fileId: number,
  baseDir: string,
  formattedDate: string,
): Promise<void> {
  const directoryPath = `${baseDir}/${formattedDate}`;

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
  const mockup = await sharp(Buffer.from(buffer, 'base64'))
    .resize(1502, 1145)
    .jpeg()
    .toBuffer();

  await createFile(
    directoryPath,
    `${filename}-${fileId}-mockup-1502x1145.jpg`,
    mockup,
  );

  const image1 = await sharp(Buffer.from(buffer, 'base64'))
    .resize(4125, 3000)
    .jpeg()
    .toBuffer();

  await createFile(
    directoryPath,
    `${filename}-${fileId}-4125x3000.jpg`,
    image1,
  );
}

export async function resizeLunchBag(
  buffer: string,
  filename: string,
  fileId: number,
  baseDir: string,
  formattedDate: string,
): Promise<void> {
  const directoryPath = `${baseDir}/${formattedDate}`;

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
  const mockup = await sharp(Buffer.from(buffer, 'base64'))
    .resize(784, 607)
    .jpeg()
    .toBuffer();

  await createFile(
    directoryPath,
    `${filename}-${fileId}-mockup-784x607.jpg`,
    mockup,
  );

  const image1 = await sharp(Buffer.from(buffer, 'base64'))
    .resize(1401, 1085)
    .jpeg()
    .toBuffer();

  await createFile(
    directoryPath,
    `${filename}-${fileId}-1401x1085.jpg`,
    image1,
  );
}

async function createFile(
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
