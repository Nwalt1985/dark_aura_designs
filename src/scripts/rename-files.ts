import fs from 'fs';
import path from 'path';

const FOLDER_PATH = path.resolve(
  process.env.HOME || '',
  `Desktop/dark_aura_designs/rescale_pillow_covers`,
);

// Function to rename files
async function renameFiles() {
  try {
    // Read all files in the directory
    const files = fs.readdirSync(FOLDER_PATH);

    console.log(files);

    for (const file of files) {
      // Match pattern: anything followed by -numbers-4050x4050
      const newFileName = file.replace(/-\d+-4050x4050/, '');

      if (file !== newFileName) {
        const oldPath = path.join(FOLDER_PATH, file);
        const newPath = path.join(FOLDER_PATH, newFileName);

        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: ${file} -> ${newFileName}`);
      }
    }

    console.log('File renaming completed successfully!');
  } catch (error) {
    console.error('Error renaming files:', error);
  }
}

// Execute the script
renameFiles();
