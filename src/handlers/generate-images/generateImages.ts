import { createDBListing } from '../../service/db';
import fs from 'fs';
import {
  resizeDeskmats,
  getformattedDate,
  removeRescaleImage,
  resizePillowImage,
} from '../../helpers';
import { Product, ProductName } from '../../models/types/listing';
import { getImageData } from './queryWithOpenAi';
import path from 'path';

export async function generateImagesFromRescale(
  product: Product,
  limit: number,
): Promise<void> {
  try {
    const formattedDate = getformattedDate();

    const rescaleDir = product.rescale;

    const outputDir = product.baseDir;

    const files = fs.readdirSync(rescaleDir);

    for (let i = 0; i < limit; i++) {
      const file = files[i];
      const fileId = generateRandomNumber();
      const filePath = path.join(rescaleDir, file);
      const buffer = fs.readFileSync(filePath);

      if (file === '.DS_Store') continue;

      const imageData = await getImageData(
        buffer.toString('base64'),
        product.name,
      );

      const fileName = file
        .replace('.png', '')
        .replace('.jpg', '')
        .toLowerCase();

      const dbData = {
        ...imageData,
        productType: product.name,
        filename: `${fileName}-${fileId}`,
        description: `${imageData.description}
			  ${product.defaultDescription}`,
      };

      await createDBListing([dbData]);

      switch (product.name) {
        case ProductName.DESK_MAT:
          await resizeDeskmats(
            buffer.toString('base64'),
            fileName,
            fileId,
            outputDir,
            formattedDate,
          );
          break;

        case ProductName.PILLOW:
          await resizePillowImage(
            buffer.toString('base64'),
            fileName,
            fileId,
            outputDir,
            formattedDate,
          );
          break;
      }

      await removeRescaleImage(product, fileName);
    }
    return;
  } catch (error) {
    throw error;
  }
}

function generateRandomNumber(): number {
  let randomNumber = Math.floor(Math.random() * 1000000);
  if (randomNumber < 100000) {
    randomNumber += 100000;
  }
  return randomNumber;
}
