import OpenAI from 'openai';
import {
  blanketGenericKeywords,
  deskMatgenericKeywords,
  pillowGenericKeywords,
  wovenBlanketGenericKeywords,
} from './genericKeywords';
import { ProductName } from '../../models/types/listing';

const openai = new OpenAI();

// Map product types to their generic keywords
const productGenericKeywords: Record<ProductName, string[]> = {
  [ProductName.DESK_MAT]: deskMatgenericKeywords,
  [ProductName.PILLOW]: pillowGenericKeywords,
  [ProductName.BLANKET]: blanketGenericKeywords,
  [ProductName.WOVEN_BLANKET]: wovenBlanketGenericKeywords,
  [ProductName.PILLOW_COVER]: pillowGenericKeywords, // Assuming pillow cover uses the same keywords as pillow
};

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

interface ImageDataResponse {
  description: string;
  title: string;
  theme: string;
  style: string;
  filename: string;
  keywords: string[];
}

// Product-specific configuration for prompts
interface ProductPromptConfig {
  defaultTitle: string;
  productNameInTitle: string;
  exampleTitles: string[];
}

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

// Generate a standardized prompt template
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

export async function getImageData(image: Buffer, type: ProductName): Promise<ImageDataResponse> {
  const config = productPromptConfigs[type];
  if (!config) {
    throw new Error(`No prompt configuration found for product type: ${type}`);
  }

  const promptText = generatePromptTemplate(config);
  const base64Image = image.toString('base64');

  const response = await openai.chat.completions.create({
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
  });

  const content =
    response.choices && response.choices[0] && response.choices[0].message
      ? response.choices[0].message.content || '{}'
      : '{}';
  const result = JSON.parse(content) as ImageDataResponse;

  if (result.keywords && result.keywords.length === 0) {
    throw new Error('No keywords generated');
  }

  const keywordsWithGeneric = generateKeywordArray(result.keywords, type);

  const resultWithGenericKeywords = {
    ...result,
    keywords: keywordsWithGeneric,
  };

  return resultWithGenericKeywords;
}
