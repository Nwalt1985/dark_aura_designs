import sharp from 'sharp';
import fs from 'fs';
import { createFile } from '.';

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

  await Promise.all([
    createFile(
      directoryPath,
      `${filename}-${fileId}-mockup-2543x1254.jpg`,
      await sharp(Buffer.from(buffer, 'base64'))
        .resize(2543, 1254)
        .jpeg()
        .toBuffer(),
    ),
    createFile(
      directoryPath,
      `${filename}-${fileId}-4320x3630.jpg`,
      await sharp(Buffer.from(buffer, 'base64'))
        .resize(4320, 3630)
        .jpeg()
        .toBuffer(),
    ),
    createFile(
      directoryPath,
      `${filename}-${fileId}-7080x4140.jpg`,
      await sharp(Buffer.from(buffer, 'base64'))
        .resize(7080, 4140)
        .jpeg()
        .toBuffer(),
    ),
    createFile(
      directoryPath,
      `${filename}-${fileId}-9450x4650.jpg`,
      await sharp(Buffer.from(buffer, 'base64'))
        .resize(9450, 4650)
        .jpeg()
        .toBuffer(),
    ),
  ]);
}

export async function resizePillowImage(
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

  await Promise.all([
    createFile(
      directoryPath,
      `${filename}-${fileId}-mockup-1275x1275.jpg`,
      await sharp(Buffer.from(buffer, 'base64'))
        .resize(1275, 1275)
        .jpeg()
        .toBuffer(),
    ),
    createFile(
      directoryPath,
      `${filename}-${fileId}-4050x4050.jpg`,
      await sharp(Buffer.from(buffer, 'base64'))
        .resize(4050, 4050)
        .jpeg()
        .toBuffer(),
    ),
  ]);
}

export async function resizeBlanketImage(
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

  if (filename.includes('_portrait')) {
    await Promise.all([
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-826x1063.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .resize(826, 1063)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-rotated-1063x826.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .rotate(270)
          .resize(1063, 826)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-cropped-1200x1600.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .resize(2000, 1523)
          .extract({ left: 0, top: 0, width: 1600, height: 1200 })
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-4252x3307.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .rotate(270)
          .resize(4252, 3307)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-6299x5276.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .rotate(270)
          .resize(6299, 5276)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-8228x6260.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .rotate(270)
          .resize(8228, 6260)
          .jpeg()
          .toBuffer(),
      ),
    ]);
  } else {
    await Promise.all([
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-1063x826.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .resize(1063, 826)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-rotated-826x1063.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .rotate(270)
          .resize(826, 1063)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-cropped-1200x1600.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .rotate(90)
          .resize(2000, 1523)
          .extract({ left: 0, top: 0, width: 1600, height: 1200 })
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-4252x3307.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .resize(4252, 3307)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-6299x5276.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .resize(6299, 5276)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-8228x6260.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .resize(8228, 6260)
          .jpeg()
          .toBuffer(),
      ),
    ]);
  }
}

export async function resizeWovenBlanketImage(
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

  if (filename.includes('_portrait')) {
    await Promise.all([
      createFile(
        directoryPath,
        `${filename}-${fileId}-4992x3552.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .rotate(270)
          .resize(4992, 3552)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-5760x4800.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .rotate(270)
          .resize(5760, 4800)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-7680x5760.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .rotate(270)
          .resize(7680, 5760)
          .jpeg()
          .toBuffer(),
      ),
    ]);

    // Create Mockups - Portrait
    await Promise.all([
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-2868x3442.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .resize(2868, 3442)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-9601x8000.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .resize(9601, 8000)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-rotated-3613x3037.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .rotate(90)
          .resize(3613, 3037)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-cropped-4290x2910.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .resize(11520, 15360, {
            fit: 'cover',
            position: 'north',
          })
          .extract({ left: 7200, top: 0, width: 4290, height: 2910 })
          .jpeg()
          .toBuffer(),
      ),
    ]);
  } else {
    await Promise.all([
      createFile(
        directoryPath,
        `${filename}-${fileId}-4992x3552.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .resize(4992, 3552)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-5760x4800.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .resize(5760, 4800)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-7680x5760.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .resize(7680, 5760)
          .jpeg()
          .toBuffer(),
      ),
    ]);

    // Create Mockups - Landscape
    await Promise.all([
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-3613x3037.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .resize(3613, 3037)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-8000x9601.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .resize(8000, 9601)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-rotated-2868x3442.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .rotate(90)
          .resize(2868, 3442)
          .jpeg()
          .toBuffer(),
      ),
      createFile(
        directoryPath,
        `${filename}-${fileId}-mockup-cropped-4290x2910.jpg`,
        await sharp(Buffer.from(buffer, 'base64'))
          .resize(15360, 11520, {
            fit: 'cover',
            position: 'north',
          })
          .extract({ left: 11000, top: 0, width: 4290, height: 2910 })
          .jpeg()
          .toBuffer(),
      ),
    ]);
  }
}
