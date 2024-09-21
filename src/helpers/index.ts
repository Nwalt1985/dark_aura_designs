import fs from 'fs';
import path from 'path';

export function getGeneratedFileNames() {
  const fileNameArray: string[] = [];

  const originalDir = path.resolve(
    process.env.HOME || '',
    `Desktop/ai_etsy/etsy_assets/original`,
  );

  fs.readdirSync(originalDir).forEach((folder) => {
    if (folder.match(/\d{2}-\d{2}-\d{4}/)) {
      const folderPath = path.resolve(originalDir, folder);
      fs.readdirSync(folderPath).forEach((file) => {
        const subfolderPath = path.resolve(folderPath, file);
        fs.readdirSync(subfolderPath).forEach((subfile) => {
          fileNameArray.push(subfile.replace('.png', ''));
        });
      });
    }
  });

  return fileNameArray
    .filter((fileName) => fileName.includes('mockup-2543x1254'))
    .map((fileName) => fileName.replace('-mockup-2543x1254', ''));
}

export async function getMockups() {
  const mockupDir = path.resolve(
    process.env.HOME || '',
    `Desktop/ai_etsy/etsy_assets/mock_ups`,
  );

  const mockupsArray: string[] = [];

  fs.readdirSync(mockupDir).forEach((folder) => {
    if (folder.match(/\d{2}-\d{2}-\d{4}/)) {
      const folderPath = path.resolve(mockupDir, folder);
      fs.readdirSync(folderPath).forEach((file) => {
        const subfolderPath = path.resolve(folderPath, file);
        fs.readdirSync(subfolderPath).forEach((subfile) => {
          mockupsArray.push(subfile);
        });
      });
    }
  });

  return mockupsArray;
}
