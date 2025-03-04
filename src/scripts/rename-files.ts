import fs from 'fs';
import path from 'path';

const FOLDER_PATH = path.resolve(
  process.env.HOME || '',
  `Desktop/dark_aura_designs/rescale_pillow_covers`,
);

// Function to rename files
function renameFiles(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Read all files in the directory
      const files = fs.readdirSync(FOLDER_PATH);

      process.stdout.write(`${JSON.stringify(files)}\n`);

      for (const file of files) {
        // Match pattern: anything followed by -numbers-4050x4050
        const newFileName = file.replace(/-\d+-4050x4050/, '');

        if (file !== newFileName) {
          const oldPath = path.join(FOLDER_PATH, file);
          const newPath = path.join(FOLDER_PATH, newFileName);

          fs.renameSync(oldPath, newPath);
          process.stdout.write(`Renamed: ${file} -> ${newFileName}\n`);
        }
      }

      process.stdout.write('File renaming completed successfully!\n');
      resolve();
    } catch (error) {
      process.stderr.write(
        `Error renaming files: ${error instanceof Error ? error.message : String(error)}\n`,
      );
      reject(error);
    }
  });
}

// Execute the script
void renameFiles();
