import sharp from 'sharp';
import fs from 'fs';
import { createFile } from '.';
import { Logger, handleError, ValidationError } from '../errors';
import path from 'path';

function validateAndCreateDirectory(directoryPath: string): void {
  try {
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError(`Failed to create directory: ${directoryPath}`, error);
  }
}

async function processImage(
  buffer: Buffer,
  width: number,
  height: number,
  options?: {
    rotate?: number;
    extract?: { left: number; top: number; width: number; height: number };
    fit?: keyof sharp.FitEnum;
    position?: string;
  },
): Promise<Buffer> {
  try {
    let sharpInstance = sharp(buffer);

    if (options?.rotate) {
      sharpInstance = sharpInstance.rotate(options.rotate);
    }

    const resizeOptions: sharp.ResizeOptions = {
      fit: options?.fit as keyof sharp.FitEnum,
      position: options?.position,
    };

    sharpInstance = sharpInstance.resize(width, height, resizeOptions);

    if (options?.extract) {
      sharpInstance = sharpInstance.extract(options.extract);
    }

    return await sharpInstance.jpeg().toBuffer();
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError('Failed to process image', error);
  }
}

export async function resizeDeskmats(
  buffer: Buffer,
  filename: string,
  fileId: number,
  baseDir: string,
  formattedDate: string,
): Promise<void> {
  const directoryPath = path.join(baseDir, formattedDate);
  validateAndCreateDirectory(directoryPath);

  try {
    await Promise.all([
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-2543x1254.jpg`,
        await processImage(buffer, 2543, 1254),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-4320x3630.jpg`,
        await processImage(buffer, 4320, 3630),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-7080x4140.jpg`,
        await processImage(buffer, 7080, 4140),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-9450x4650.jpg`,
        await processImage(buffer, 9450, 4650),
      ),
    ]);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError('Failed to resize desk mat images', error);
  }
}

export async function resizePillowImage(
  buffer: Buffer,
  filename: string,
  fileId: number,
  baseDir: string,
  formattedDate: string,
): Promise<void> {
  const directoryPath = path.join(baseDir, formattedDate);
  validateAndCreateDirectory(directoryPath);

  try {
    await Promise.all([
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-1275x1275.jpg`,
        await processImage(buffer, 1275, 1275),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-4050x4050.jpg`,
        await processImage(buffer, 4050, 4050),
      ),
    ]);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError('Failed to resize pillow images', error);
  }
}

export async function resizeBlanketImage(
  buffer: Buffer,
  filename: string,
  fileId: number,
  baseDir: string,
  formattedDate: string,
): Promise<void> {
  const directoryPath = path.join(baseDir, formattedDate);
  validateAndCreateDirectory(directoryPath);

  try {
    if (filename.includes('_portrait')) {
      await Promise.all([
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-826x1063.jpg`,
          await processImage(buffer, 826, 1063),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-rotated-1063x826.jpg`,
          await processImage(buffer, 1063, 826, { rotate: 270 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-cropped-1200x1600.jpg`,
          await processImage(buffer, 2000, 1523, {
            extract: { left: 0, top: 0, width: 1600, height: 1200 },
          }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-4252x3307.jpg`,
          await processImage(buffer, 4252, 3307, { rotate: 270 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-6299x5276.jpg`,
          await processImage(buffer, 6299, 5276, { rotate: 270 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-8228x6260.jpg`,
          await processImage(buffer, 8228, 6260, { rotate: 270 }),
        ),
      ]);
    } else {
      await Promise.all([
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-1063x826.jpg`,
          await processImage(buffer, 1063, 826),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-rotated-826x1063.jpg`,
          await processImage(buffer, 826, 1063, { rotate: 270 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-cropped-1200x1600.jpg`,
          await processImage(buffer, 2000, 1523, {
            rotate: 90,
            extract: { left: 0, top: 0, width: 1600, height: 1200 },
          }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-4252x3307.jpg`,
          await processImage(buffer, 4252, 3307),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-6299x5276.jpg`,
          await processImage(buffer, 6299, 5276),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-8228x6260.jpg`,
          await processImage(buffer, 8228, 6260),
        ),
      ]);
    }
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError('Failed to resize blanket images', error);
  }
}

export async function resizeWovenBlanketImage(
  buffer: Buffer,
  filename: string,
  fileId: number,
  baseDir: string,
  formattedDate: string,
): Promise<void> {
  const directoryPath = path.join(baseDir, formattedDate);
  validateAndCreateDirectory(directoryPath);

  try {
    if (filename.includes('_portrait')) {
      await Promise.all([
        createFile(
          directoryPath,
          `${filename}-${fileId}-4992x3552.jpg`,
          await processImage(buffer, 4992, 3552, { rotate: 270 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-5760x4800.jpg`,
          await processImage(buffer, 5760, 4800, { rotate: 270 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-7680x5760.jpg`,
          await processImage(buffer, 7680, 5760, { rotate: 270 }),
        ),
      ]);

      // Create Mockups - Portrait
      await Promise.all([
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-2868x3442.jpg`,
          await processImage(buffer, 2868, 3442),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-9601x8000.jpg`,
          await processImage(buffer, 9601, 8000),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-rotated-3613x3037.jpg`,
          await processImage(buffer, 3613, 3037, { rotate: 90 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-cropped-4290x2910.jpg`,
          await processImage(buffer, 11520, 15360, {
            fit: 'cover',
            position: 'north',
            extract: { left: 7200, top: 0, width: 4290, height: 2910 },
          }),
        ),
      ]);
    } else {
      await Promise.all([
        createFile(
          directoryPath,
          `${filename}-${fileId}-4992x3552.jpg`,
          await processImage(buffer, 4992, 3552),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-5760x4800.jpg`,
          await processImage(buffer, 5760, 4800),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-7680x5760.jpg`,
          await processImage(buffer, 7680, 5760),
        ),
      ]);

      // Create Mockups - Landscape
      await Promise.all([
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-3613x3037.jpg`,
          await processImage(buffer, 3613, 3037),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-8000x9601.jpg`,
          await processImage(buffer, 8000, 9601),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-rotated-2868x3442.jpg`,
          await processImage(buffer, 2868, 3442, { rotate: 90 }),
        ),
        createFile(
          directoryPath,
          `${filename}-${fileId}-mockup-cropped-4290x2910.jpg`,
          await processImage(buffer, 15360, 11520, {
            fit: 'cover',
            position: 'north',
            extract: { left: 11000, top: 0, width: 4290, height: 2910 },
          }),
        ),
      ]);
    }
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw new ValidationError('Failed to resize woven blanket images', error);
  }
}
