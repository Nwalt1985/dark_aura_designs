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
    .filter((fileName) => {
      if (fileName.includes('-9450x4650')) {
        return fileName;
      }
    })
    .map((fileName) => fileName.replace('-9450x4650', ''));
  // .map((name) => name.replace(/-\d+$/, ''));
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
export async function dbTidy(unlisted: PromptResponseType[]) {
  const unlistedFileNames = unlisted.map((listing) => {
    if (!listing.filename) {
      console.log('No filename found for listing', listing);
    }

    return listing.filename.replace(/(-\d+x\d+)?$/, '');
  });

  const generatedImagesFilenames = getGeneratedFileNames();

  for (const listing of unlistedFileNames) {
    if (!generatedImagesFilenames.includes(listing)) {
      console.log(`Deleting ${listing} from the DB`);
      await deleteListingByFileName(listing);
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
    fileId: string | null;
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
              fileId: extractImageId(subfile),
              base64: fs.readFileSync(path.resolve(subfolderPath, subfile)),
            });
          }
        });
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
