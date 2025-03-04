/**
 * OpenAI Integration Module
 *
 * This module handles the integration with OpenAI's API to generate metadata for product images.
 * It provides functionality to analyze images and generate SEO-optimized titles, descriptions,
 * keywords, and other metadata for product listings.
 */
import OpenAI from 'openai';
import {
  blanketGenericKeywords,
  deskMatgenericKeywords,
  pillowGenericKeywords,
  wovenBlanketGenericKeywords,
} from './genericKeywords';
import { ProductName } from '../../models/types/listing';
import { Logger, handleError, ExternalServiceError } from '../../errors';

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Map of product types to their respective generic keywords.
 * Used to supplement AI-generated keywords with product-specific generic keywords.
 */
const productGenericKeywords: Record<ProductName, string[]> = {
  [ProductName.DESK_MAT]: deskMatgenericKeywords,
  [ProductName.PILLOW]: pillowGenericKeywords,
  [ProductName.BLANKET]: blanketGenericKeywords,
  [ProductName.WOVEN_BLANKET]: wovenBlanketGenericKeywords,
  [ProductName.PILLOW_COVER]: pillowGenericKeywords, // Assuming pillow cover uses the same keywords as pillow
};

/**
 * Generates a combined array of keywords by adding random generic keywords to the provided keywords.
 *
 * @param {string[]} keywords - Base keywords to supplement
 * @param {ProductName} product - Product type to get generic keywords for
 * @returns {string[]} Combined array of keywords
 * @throws {Error} If no keywords could be generated
 */
function generateKeywordArray(keywords: string[], product: ProductName): string[] {
  const selectedKeywords = new Set<string>();

  const genericKeywords = productGenericKeywords[product] || [];

  // First deduplicate the generic keywords
  const uniqueGenericKeywords = Array.from(new Set(genericKeywords));

  // Check if we have enough unique keywords
  const numKeywordsToAdd = Math.min(5, uniqueGenericKeywords.length);

  while (selectedKeywords.size < numKeywordsToAdd) {
    const randomIndex = Math.floor(Math.random() * uniqueGenericKeywords.length);
    const keyword = uniqueGenericKeywords[randomIndex];
    if (keyword) {
      selectedKeywords.add(keyword);
    }
  }

  if (Array.from(selectedKeywords).length === 0) {
    throw new Error('No keywords generated');
  }

  return keywords.concat(Array.from(selectedKeywords));
}

/**
 * Interface defining the structure of image data response from OpenAI.
 */
interface ImageDataResponse {
  description: string;
  title: string;
  theme: string;
  style: string;
  filename: string;
  keywords: string[];
}

/**
 * Configuration interface for product-specific prompt templates.
 */
interface ProductPromptConfig {
  defaultTitle: string;
  productNameInTitle: string;
  exampleTitles: string[];
}

/**
 * Map of product types to their respective prompt configurations.
 * Used to generate appropriate prompts for each product type.
 */
const productPromptConfigs: Record<ProductName, ProductPromptConfig> = {
  [ProductName.DESK_MAT]: {
    defaultTitle: '| XL Mouse Matt | Accessories For Home & Office',
    productNameInTitle: 'Desk Mat',
    exampleTitles: [
      'Geometric Art Desk Mat | Trendy Desk Decor | XL Mouse Matt | Accessories For Home & Office',
      'Abstract Geometric Art Desk Mat | XL Mouse Matt | Accessories For Home & Office',
    ],
  },
  [ProductName.PILLOW]: {
    defaultTitle: '| Witchy Cushion | Gothic Homeware | Alternative Home Decor',
    productNameInTitle: 'Cushion',
    exampleTitles: [
      'Modern Abstract Geometric Art Cushion | Witchy Pillow  | Gothic Homeware | Alternative Home Decor',
      'Gothic Geometric Cushion | Witchy Pillow  | Gothic Homeware | Alternative Home Decor',
    ],
  },
  [ProductName.BLANKET]: {
    defaultTitle: '| Witchy Blanket | Gothic Homeware | Alternative Home Decor',
    productNameInTitle: 'Blanket',
    exampleTitles: [
      'Geometric Art Blanket | Witchy Blanket  | Gothic Homeware | Alternative Home Decor',
      'Gothic Geometric Blanket | Witchy Blanket | Gothic Homeware | Alternative Home Decor',
    ],
  },
  [ProductName.WOVEN_BLANKET]: {
    defaultTitle: '| Witchy Woven Blanket | Gothic Homeware For Home And Office',
    productNameInTitle: 'Woven Blanket',
    exampleTitles: [
      'Geometric Art Woven Blanket | Witchy Woven Throw | Gothic Homeware | Accessories For Home & Office',
      'Geometric Woven Blanket | Abstract Design Woven Throw | Witchy Woven Blanket | Accessories For Home & Office',
    ],
  },
  [ProductName.PILLOW_COVER]: {
    defaultTitle: '| Witchy Pillow Cover | Gothic Homeware | Alternative Home Decor',
    productNameInTitle: 'Pillow Cover',
    exampleTitles: [
      'Modern Abstract Geometric Art Pillow Cover | Witchy Pillow Cover | Gothic Homeware | Alternative Home Decor',
      'Gothic Geometric Pillow Cover | Witchy Pillow Cover | Gothic Homeware | Alternative Home Decor',
    ],
  },
};

/**
 * Generates a standardized prompt template for OpenAI based on product configuration.
 *
 * @param {ProductPromptConfig} config - Product-specific configuration
 * @returns {string} Formatted prompt template for OpenAI
 */
function generatePromptTemplate(config: ProductPromptConfig): string {
  return `Analyze this image and provide the following:

  Title: generate a keyword-rich 140-character title. The format should be descritption 1 | description 2 | description 3 etc. Description 1 should end with the word${config.productNameInTitle.startsWith('Woven') ? 's' : ''} '${config.productNameInTitle}'.

  The title should contain the following default text ${config.defaultTitle}. The title can not contain the characters %,&,: more than once. IMPORTANT: The title cannot be more than 140 characters. Here are some example titles:

  ${config.exampleTitles.join('\n\n  ')}

  Filename: generate a concise filename with the structure "this_is_a_filename". Don't include the file format.

  Description: SEO-optimized Etsy description.

  Keywords: generate 8 SEO-optimized keywords related to the image.

  Output the results in a JSON format. Structure the JSON as follows:

  ${JSON.stringify(
    {
      description: 'Description 1',
      title: 'Title 1',
      theme: 'Theme 1',
      style: 'Style 1',
      filename: 'Filename 1',
      keywords: ['keyword1', 'keyword2', 'keyword3'],
    },
    null,
    2,
  )}
`;
}

/**
 * Executes an OpenAI API call with retry logic
 *
 * @param {Function} apiCall - Function that makes the API call
 * @param {string} operationName - Name of the operation for logging
 * @returns {Promise<T>} The API response
 * @throws {ExternalServiceError} If all retry attempts fail
 */
async function executeWithRetry<T>(apiCall: () => Promise<T>, operationName: string): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await apiCall();
    } catch (error: unknown) {
      lastError = error;
      const handledError = handleError(error);

      // Check if we should retry based on error type
      const isRateLimitError =
        error instanceof Error &&
        (error.message.includes('rate_limit') || error.message.includes('429'));

      if (
        attempt < MAX_RETRIES &&
        (isRateLimitError || (error instanceof Error && error.message.includes('timeout')))
      ) {
        const delay = RETRY_DELAY_MS * attempt;
        Logger.warn(`${operationName} attempt ${attempt} failed. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      Logger.error(handledError);
      break;
    }
  }

  throw new ExternalServiceError(
    `${operationName} failed after ${MAX_RETRIES} attempts`,
    lastError,
  );
}

/**
 * Analyzes an image using OpenAI to generate product metadata.
 *
 * @param {Buffer} image - Image buffer to analyze
 * @param {ProductName} type - Type of product for context
 * @returns {Promise<ImageDataResponse>} Promise resolving to structured image data
 * @throws {ExternalServiceError} If OpenAI request fails or response is invalid
 */
export async function getImageData(image: Buffer, type: ProductName): Promise<ImageDataResponse> {
  const config = productPromptConfigs[type];
  if (!config) {
    throw new ExternalServiceError(`No prompt configuration found for product type: ${type}`);
  }

  const promptText = generatePromptTemplate(config);
  const base64Image = image.toString('base64');

  try {
    const response = await executeWithRetry(
      async () =>
        openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: promptText,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        }),
      'OpenAI image analysis',
    );

    const content =
      response.choices && response.choices[0] && response.choices[0].message
        ? response.choices[0].message.content || '{}'
        : '{}';

    let result: ImageDataResponse;

    try {
      result = JSON.parse(content) as ImageDataResponse;
    } catch (parseError) {
      throw new ExternalServiceError('Failed to parse OpenAI response', {
        content,
        parseError,
      });
    }

    if (!result.keywords || result.keywords.length === 0) {
      throw new ExternalServiceError('No keywords generated in OpenAI response');
    }

    if (!result.title) {
      throw new ExternalServiceError('No title generated in OpenAI response');
    }

    const keywordsWithGeneric = generateKeywordArray(result.keywords, type);

    const resultWithGenericKeywords = {
      ...result,
      keywords: keywordsWithGeneric,
    };

    return resultWithGenericKeywords;
  } catch (error: unknown) {
    const handledError = handleError(error);
    Logger.error(handledError);

    if (error instanceof ExternalServiceError) {
      throw error;
    }

    throw new ExternalServiceError('Failed to generate image data with OpenAI', error);
  }
}
