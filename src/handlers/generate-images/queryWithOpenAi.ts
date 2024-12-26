import OpenAI from 'openai';
import {
  deskMatgenericKeywords,
  lunchBagGenericKeywords,
  sleeveGenericKeywords,
} from './genericKeywords';
import { ProductName } from '../../models/types/listing';

const openai = new OpenAI();

function generateKeywordArray(keywords: string[], product: string): string[] {
  const selectedKeywords = new Set<string>();

  let genericKeywords: string[] = [];

  switch (product) {
    case ProductName.DESK_MAT:
      genericKeywords = deskMatgenericKeywords;
      break;
    case ProductName.LAPTOP_SLEEVE:
      genericKeywords = sleeveGenericKeywords;
      break;
    case ProductName.LUNCH_BAG:
      genericKeywords = lunchBagGenericKeywords;
      break;
  }

  while (selectedKeywords.size < 5) {
    const randomIndex = Math.floor(Math.random() * genericKeywords.length);

    selectedKeywords.add(genericKeywords[randomIndex]);
  }

  return keywords.concat(Array.from(selectedKeywords));
}

export async function getImageData(image: string, type: ProductName) {
  try {
    let title;

    switch (type) {
      case ProductName.DESK_MAT:
        title = '| XL Mouse Matt | Tech Accessories For Home And Office';
        break;
      case ProductName.LAPTOP_SLEEVE:
        title = '| Laptop Cover | Tech Accessories For Home And Office';
        break;
      case ProductName.LUNCH_BAG:
        title = '| Lunch Box | Accessories For Home, School And Office';
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
              text: `Analyze this image and provide the following:
		
			Title: generate a keyword-rich 140-character title. The format should be descritption 1 | description 2 | description 3 etc. Description 1 should end with the words 'Desk Mat'.
			
			The title should contain the following default text ${title}. The title can not contain the characters %,&,: more than once. Here are some example titles:

			Funky Geometric Art Desk Mat | Trendy Desk Decor | Vibrant Mouse Pad | XL Mouse Matt | Tech Accessories For Home And Office

			Modern Abstract Geometric Art Desk Mat | Blue & Cream Design Desk Pad | XL Mouse Matt | Tech Accessories For Home And Office
				
			Filename: generate a concise filename with the structure "this_is_a_filename". Don't include the file format.
		
			Decription: SEO-optimized Etsy description.

			Keywords: generate 8 SEO-optimized keywords related to the image.

    		Output the results in a JSON format. Structure the JSON as follows:
		
     		{
     		  "description": "Description 1",
     		  "title": "Title 1",
			  "theme": "Theme 1",
			  "style": "Style 1",
     		  "filename": "Filename 1",
     		  "keywords": [keyword1, keyword2, keyword3],
     		},
     	  
     	`,
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

    const result = JSON.parse(response.choices[0].message.content || '{}');

    const keywordsWithGeneric = generateKeywordArray(result.keywords, type);
    const resultWithGenericKeywords = {
      ...result,
      keywords: keywordsWithGeneric,
    };

    return resultWithGenericKeywords;
  } catch (err) {
    throw err;
  }
}
