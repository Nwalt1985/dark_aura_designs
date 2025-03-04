import fs from 'fs';
import path from 'path';
import { Logger } from 'src/errors/logger';
import { ErrorType } from 'src/errors/CustomError';

const FOLDER_PATH = path.resolve(
  process.env['HOME'] || '',
  `Desktop/dark_aura_designs/rescale_pillow_covers`,
);

// Function to rename files
function renameFiles(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Read all files in the directory
      const files = fs.readdirSync(FOLDER_PATH);

      Logger.info(`${JSON.stringify(files)}`);

      for (const file of files) {
        // Match pattern: anything followed by -numbers-4050x4050
        const newFileName = file.replace(/-\d+-4050x4050/, '');

        if (file !== newFileName) {
          const oldPath = path.join(FOLDER_PATH, file);
          const newPath = path.join(FOLDER_PATH, newFileName);

          fs.renameSync(oldPath, newPath);
          Logger.info(`Renamed: ${file} -> ${newFileName}`);
        }
      }

      Logger.info('File renaming completed successfully!');
      resolve();
    } catch (error) {
      Logger.error({
        type: ErrorType.INTERNAL,
        code: 500,
        message: `Error renaming files: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
      });
      reject(error);
    }
  });
}

// Execute the script
void renameFiles();
