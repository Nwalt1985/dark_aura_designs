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
import { ProductData } from '../../models/schemas/db';
import { Logger, handleError, ValidationError } from '../../errors';

function validateImageData(imageData: Partial<ProductData>, fileName: string): ProductData {
  if (!imageData) {
    throw new ValidationError(`Image data is missing for file: ${fileName}`);
  }

  if (!imageData.title) {
    throw new ValidationError(`Title is missing for file: ${fileName}`);
  }

  if (imageData.title.length > 140) {
    throw new ValidationError(`Title is too long for file: ${fileName}`);
  }

  // Ensure other required fields have at least default values
  return {
    prompt: imageData.prompt || '',
    title: imageData.title,
    description: imageData.description || '',
    keywords: imageData.keywords || [],
    theme: imageData.theme || '',
    style: imageData.style || '',
    // Include any other required fields from ProductData with defaults
    ...imageData,
  } as ProductData;
}

// Define the type for the image processor function
type ImageProcessor = (
  buffer: Buffer,
  filename: string,
  fileId: number,
  baseDir: string,
  formattedDate: string,
) => Promise<void>;

// Map of product types to their respective image processing functions
const productImageProcessors: Record<ProductName, ImageProcessor> = {
  [ProductName.DESK_MAT]: resizeDeskmats,
  [ProductName.PILLOW]: resizePillowImage,
  [ProductName.BLANKET]: resizeBlanketImage,
  [ProductName.WOVEN_BLANKET]: resizeWovenBlanketImage,
  [ProductName.PILLOW_COVER]: resizePillowImage, // Assuming pillow cover uses the same processor as pillow
};

async function processImageFile(
  filePath: string,
  fileName: string,
  fileId: number,
  product: Product,
  formattedDate: string,
): Promise<void> {
  try {
    const buffer = fs.readFileSync(filePath);
    const partialImageData = (await getImageData(buffer, product.name)) as Partial<ProductData>;

    // Validate and get complete image data with all required fields
    const imageData = validateImageData(partialImageData, fileName);

    const dbData = {
      prompt: imageData.prompt,
      productType: product.name,
      description: `${imageData.description}
        ${product.defaultDescription}`,
      title: imageData.title,
      keywords: imageData.keywords,
      theme: imageData.theme,
      style: imageData.style,
      filename: `${fileName}-${fileId}`,
      createdAt: new Date().toISOString(),
    };

    await createDBListing([dbData]);

    const processImage = productImageProcessors[product.name];

    if (!processImage) {
      throw new ValidationError(`Unsupported product type: ${product.name}`);
    }

    await processImage(buffer, fileName, fileId, product.baseDir, formattedDate);

    relocateRescaleImage(product, fileName);
    Logger.info(`Successfully processed image: ${fileName}`);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw error;
  }
}

export async function generateImagesFromRescale(product: Product, limit: number): Promise<void> {
  const formattedDate = getformattedDate();
  const rescaleDir = product.rescale;

  try {
    if (!fs.existsSync(rescaleDir)) {
      throw new ValidationError(`Rescale directory does not exist: ${rescaleDir}`);
    }

    const files = fs.readdirSync(rescaleDir).filter((file) => !file.startsWith('.'));
    const processLimit = Math.min(limit, files.length);

    Logger.info(`Processing ${processLimit} files from ${rescaleDir}`);

    for (let i = 0; i < processLimit; i++) {
      const file = files[i];
      if (!file) continue;

      const fileId = Math.floor(Math.random() * 9000) + 1000;
      const filePath = path.join(rescaleDir, file);
      const fileName = file.replace(/\.(png|jpg)$/, '').toLowerCase();

      try {
        await processImageFile(filePath, fileName, fileId, product, formattedDate);
      } catch (error: unknown) {
        const handledError = handleError(error);
        Logger.error(handledError);
        Logger.warn(`Skipping file due to error: ${file}`);
        continue;
      }
    }

    Logger.info(`Completed processing ${processLimit} files`);
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);
    throw error;
  }
}
