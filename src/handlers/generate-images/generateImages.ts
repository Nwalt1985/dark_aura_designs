import { createDBListing } from '../../service/db';
import fs from 'fs';
import {
  resizeDeskmats,
  resizePillowImage,
  resizeBlanketImage,
  resizeWovenBlanketImage,
} from '../../helpers/rescaleImages';
import { Product, ProductName } from '../../models/types/listing';
import { getImageData } from './queryWithOpenAi';
import path from 'path';
import { getformattedDate, relocateRescaleImage } from '../../helpers';

export async function generateImagesFromRescale(
  product: Product,
  limit: number,
): Promise<void> {
  const formattedDate = getformattedDate();

  const rescaleDir = product.rescale;

  const outputDir = product.baseDir;

  const files = fs.readdirSync(rescaleDir);

  for (let i = 0; i <= limit; i++) {
    if (i >= files.length) break;

    const file = files[i];
    const fileId = generateRandomNumber();
    const filePath = path.join(rescaleDir, file);
    const buffer = fs.readFileSync(filePath);

    if (file === '.DS_Store') continue;

    const imageData = await getImageData(
      buffer.toString('base64'),
      product.name,
    );

    if (imageData.title.length > 140) {
      console.log('Title is too long:', imageData.title);
      continue;
    }

    const fileName = file.replace('.png', '').replace('.jpg', '').toLowerCase();

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

      case ProductName.BLANKET:
        await resizeBlanketImage(
          buffer.toString('base64'),
          fileName,
          fileId,
          outputDir,
          formattedDate,
        );
        break;

      case ProductName.WOVEN_BLANKET:
        await resizeWovenBlanketImage(
          buffer.toString('base64'),
          fileName,
          fileId,
          outputDir,
          formattedDate,
        );
        break;
    }

    await relocateRescaleImage(product, fileName);
  }
  return;
}

function generateRandomNumber(): number {
  let randomNumber = Math.floor(Math.random() * 1000000);
  if (randomNumber < 100000) {
    randomNumber += 100000;
  }
  return randomNumber;
}
