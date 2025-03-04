import OpenAI from 'openai';
import {
  blanketGenericKeywords,
  deskMatgenericKeywords,
  pillowGenericKeywords,
  wovenBlanketGenericKeywords,
} from './genericKeywords';
import { ProductName } from '../../models/types/listing';

const openai = new OpenAI();

function generateKeywordArray(keywords: string[], product: ProductName): string[] {
  const selectedKeywords = new Set<string>();

  let genericKeywords: string[] = [];

  switch (product) {
    case ProductName.DESK_MAT:
      genericKeywords = deskMatgenericKeywords;
      break;
    case ProductName.PILLOW:
      genericKeywords = pillowGenericKeywords;
      break;
    case ProductName.BLANKET:
      genericKeywords = blanketGenericKeywords;
      break;
    case ProductName.WOVEN_BLANKET:
      genericKeywords = wovenBlanketGenericKeywords;
      break;
  }

  // First deduplicate the generic keywords
  const uniqueGenericKeywords = Array.from(new Set(genericKeywords));

  // Check if we have enough unique keywords
  const numKeywordsToAdd = Math.min(5, uniqueGenericKeywords.length);

  while (selectedKeywords.size < numKeywordsToAdd) {
    const randomIndex = Math.floor(Math.random() * uniqueGenericKeywords.length);
    selectedKeywords.add(uniqueGenericKeywords[randomIndex]);
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

export async function getImageData(image: string, type: ProductName): Promise<ImageDataResponse> {
  let title;
  let text;
  const outputJsonTemplate = {
    description: 'Description 1',
    title: 'Title 1',
    theme: 'Theme 1',
    style: 'Style 1',
    filename: 'Filename 1',
    keywords: ['keyword1', 'keyword2', 'keyword3'],
  };

  switch (type) {
    case ProductName.DESK_MAT:
      title = '| XL Mouse Matt | Accessories For Home & Office';
      text = `Analyze this image and provide the following:

			Title: generate a keyword-rich 140-character title. The format should be descritption 1 | description 2 | description 3 etc. Description 1 should end with the words 'Desk Mat'.

			The title should contain the following default text ${title}. The title can not contain the characters %,&,: more than once. IMPORTANT: The title cannot be more than 140 characters. Here are some example titles:

			Geometric Art Desk Mat | Trendy Desk Decor | XL Mouse Matt | Accessories For Home & Office

			Abstract Geometric Art Desk Mat | XL Mouse Matt | Accessories For Home & Office

			Filename: generate a concise filename with the structure "this_is_a_filename". Don't include the file format.

			Decription: SEO-optimized Etsy description.

			Keywords: generate 8 SEO-optimized keywords related to the image.

    		Output the results in a JSON format. Structure the JSON as follows:

     		${JSON.stringify(outputJsonTemplate, null, 2)}

     	`;
      break;
    case ProductName.PILLOW:
      title = `| Witchy Cushion | Gothic Homeware | Alternative Home Decor`;
      text = `Analyze this image and provide the following:

			Title: generate a keyword-rich 140-character title. The format should be descritption 1 | description 2 | description 3 etc. Description 1 should end with the word Cushion.

			The title should contain the following default text ${title}. The title can not contain the characters %,&,: more than once. The title cannot be more than 140 characters. Here are some example titles:

			Modern Abstract Geometric Art Cushion | Witchy Pillow  | Gothic Homeware | Alternative Home Decor

			Gothic Geometric Cushion | Witchy Pillow  | Gothic Homeware | Alternative Home Decor

			Filename: generate a concise filename with the structure "this_is_a_filename". Don't include the file format.

			Description: SEO-optimized Etsy description.

			Keywords: generate 8 SEO-optimized keywords related to the image.

    		Output the results in a JSON format. Structure the JSON as follows:

     		${JSON.stringify(outputJsonTemplate, null, 2)}

     	`;
      break;
    case ProductName.BLANKET:
      title = '| Witchy Blanket | Gothic Homeware | Alternative Home Decor';
      text = `Analyze this image and provide the following:

			Title: generate a keyword-rich 140-character title. The format should be descritption 1 | description 2 | description 3 etc. Description 1 should end with the word 'Blanket'.

			The title should contain the following default text ${title}. The title can not contain the characters %,&,: more than once. The title cannot be more than 140 characters. Here are some example titles:

			Geometric Art Blanket | Witchy Blanket  | Gothic Homeware | Alternative Home Decor

			Gothic Geometric Blanket | Witchy Blanket | Gothic Homeware | Alternative Home Decor

			Filename: generate a concise filename with the structure "this_is_a_filename". Don't include the file format.

			Description: SEO-optimized Etsy description.

			Keywords: generate 8 SEO-optimized keywords related to the image.

    		Output the results in a JSON format. Structure the JSON as follows:

     		${JSON.stringify(outputJsonTemplate, null, 2)}

     	`;
      break;
    case ProductName.WOVEN_BLANKET:
      title = '| Witchy Woven Blanket | Gothic Homeware For Home And Office';
      text = `Analyze this image and provide the following:

			Title: generate a keyword-rich 140-character title. The format should be descritption 1 | description 2 | description 3 etc. Description 1 should end with the words 'Woven Blanket'.

			The title should contain the following default text ${title}. The title can not contain the characters %,&,: more than once. The title cannot be more than 140 characters (IMPORTANT). Here are some example titles:

			Geometric Art Woven Blanket | Witchy Woven Throw | Gothic Homeware | Accessories For Home & Office

			Geometric Woven Blanket | Abstract Design Woven Throw | Witchy Woven Blanket | Accessories For Home & Office

			Filename: generate a concise filename with the structure "this_is_a_filename". Don't include the file format.

			Description: SEO-optimized Etsy description.

			Keywords: generate 8 SEO-optimized keywords related to the image.

    		Output the results in a JSON format. Structure the JSON as follows:

     		${JSON.stringify(outputJsonTemplate, null, 2)}

     	`;
      break;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: text ?? '',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content || '{}') as ImageDataResponse;

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
