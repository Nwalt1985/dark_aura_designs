import axios from 'axios';
import {
  PrintifyImageResponseType,
  PrintifyGetUploadsResponseType,
  PrintifyProductUploadRequestType,
  PrintifyProductUploadResponseType,
  PrintifyProductUploadRequest,
} from '../models/schemas/printify';
import dotenv from 'dotenv';

dotenv.config();

const printifyApiKey = process.env.PRINTIFY_API_KEY || '';

export async function uploadImages(
  buffer: Buffer,
  filename: string,
): Promise<PrintifyImageResponseType> {
  const { data } = await axios.post<PrintifyImageResponseType>(
    `https://api.printify.com/v1/uploads/images.json`,
    {
      file_name: filename,
      contents: buffer.toString('base64'),
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NodeJS',
        Authorization: `Bearer ${printifyApiKey}`,
      },
    },
  );

  return data;
}

export async function getUploadedImages(): Promise<{
  imageData: PrintifyImageResponseType[];
  length: number;
  totalImages: number;
}> {
  const imageData = [];

  const { data } = await axios.get<PrintifyGetUploadsResponseType>(
    `https://api.printify.com/v1/uploads.json`,
    {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NodeJS',
        Authorization: `Bearer ${printifyApiKey}`,
      },
    },
  );

  imageData.push(...data.data);

  if (data.to > 1) {
    const pages = data.to;

    for (let i = 2; i <= pages; i++) {
      const nextPage = await axios.get<PrintifyGetUploadsResponseType>(
        `https://api.printify.com/v1/uploads.json?page=${i}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'NodeJS',
            Authorization: `Bearer ${printifyApiKey}`,
          },
        },
      );

      imageData.push(...nextPage.data.data);
    }
  }

  return { imageData, length: imageData.length, totalImages: data.total };
}

export async function createNewProduct(
  productData: PrintifyProductUploadRequestType,
  shopId: string,
): Promise<PrintifyProductUploadResponseType> {
  PrintifyProductUploadRequest.parse(productData);

  const response = await axios.post<PrintifyProductUploadResponseType>(
    `https://api.printify.com/v1/shops/${shopId}/products.json`,
    productData,
    {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NodeJS',
        Authorization: `Bearer ${printifyApiKey}`,
      },
    },
  );

  return response.data;
}
