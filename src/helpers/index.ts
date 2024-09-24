import fs from 'fs';
import path from 'path';
import { PromptResponseType } from '../models/schemas/prompt';
import { deleteListingByFileName, getUnlisted } from '../service/db';

export function getGeneratedFileNames() {
  const originalDir = path.resolve(
    process.env.HOME || '',
    `Desktop/ai_etsy/etsy_assets/original`,
  );
  const fileNameArray = assetFolder(originalDir);

  return fileNameArray
    .filter((fileName) => fileName.includes('mockup-2543x1254'))
    .map((fileName) => fileName.replace('-mockup-2543x1254', ''));
}

export async function getMockups() {
  const mockupDir = path.resolve(
    process.env.HOME || '',
    `Desktop/ai_etsy/etsy_assets/mock_ups`,
  );

  const mockupsArray = assetFolder(mockupDir);

  return mockupsArray;
}

function assetFolder(directory: string) {
  const fileArray: string[] = [];

  fs.readdirSync(directory).forEach((folder) => {
    if (folder.match(/\d{2}-\d{2}-\d{4}/)) {
      const folderPath = path.resolve(directory, folder);

      fs.readdirSync(folderPath).forEach((file) => {
        if (file.includes('.DS_Store')) {
          return;
        }

        const subfolderPath = path.resolve(folderPath, file);

        fs.readdirSync(subfolderPath).forEach((subfile) => {
          fileArray.push(subfile.replace('.jpg', ''));
        });
      });
    }
  });

  return fileArray;
}

// Remove listings from the database that do not have a corresponding image file
export async function dbTidy(list: PromptResponseType[]) {
  const listings = list.map((listing) => {
    const filename = listing.filename.replace('-mockup-2543x1254', '');
    return {
      isListed: listing.listedAt,
      filename,
    };
  });
  const fileNameArray = getGeneratedFileNames();

  for (const listing of listings) {
    if (!fileNameArray.includes(listing.filename) && !listing.isListed) {
      console.log(`Deleting ${listing} from the DB`);
      await deleteListingByFileName(listing.filename);
    }
  }

  return await getUnlisted();
}

// Loop through the folders and subfolders in the original directory and return the buffer of the image
export async function getBuffer(fileName: string) {
  const originalDir = path.resolve(
    process.env.HOME || '',
    `Desktop/ai_etsy/etsy_assets/original`,
  );

  const buffer: {
    filename: string;
    base64: Buffer;
  }[] = [];

  fs.readdirSync(originalDir).forEach((folder) => {
    if (folder.match(/\d{2}-\d{2}-\d{4}/)) {
      const folderPath = path.resolve(originalDir, folder);

      fs.readdirSync(folderPath).forEach((file) => {
        if (file.includes('.DS_Store')) {
          return;
        }

        const subfolderPath = path.resolve(folderPath, file);

        fs.readdirSync(subfolderPath).forEach((subfile) => {
          if (subfile.includes(fileName)) {
            buffer.push({
              filename: subfile,
              base64: fs.readFileSync(path.resolve(subfolderPath, subfile)),
            });
          }
        });
      });
    }
  });

  return buffer;
}
