import { z } from 'zod';
import { PromptResponse } from '../models/schemas/prompt';
import { getMockups } from '../helpers';

const printifyApiKey = process.env.PRINTIFY_API_KEY || '';

export async function createPrintifyListings(
  dbListings: z.infer<typeof PromptResponse>,
) {
  const mockupFileNames = await getMockups();

  const printifyProductData = dbListings.map((listing) => {
    delete listing.buffer;

    const mockup = mockupFileNames.find((mockup) =>
      mockup.includes(listing.filename),
    );

    return {
      ...listing,
      mockup,
    };
  });

  console.log(printifyProductData);
}
