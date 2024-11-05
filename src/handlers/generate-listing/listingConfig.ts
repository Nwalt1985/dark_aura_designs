import dotenv from 'dotenv';
import { PrintifyImageResponseType } from '../../models/schemas/printify';

dotenv.config();

export const deskMatConfig = {
  print_provider_id: Number(process.env.DESK_MAT_PRINT_PROVIDER_ID) || 0,
  blueprint_id: Number(process.env.DESK_MAT_PRINTIFY_BLUEPRINT_ID) || 0,
  variants: [
    {
      id: 81075,
      sku: '21734943883745480231',
      price: 3190,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 103806,
      sku: '74676489247340010998',
      price: 1645,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 103807,
      sku: '82680705350038580718',
      price: 2410,
      is_enabled: true,
      is_default: true,
    },
  ],
  print_areas: [
    {
      variant_ids: [81075],
      placeholders: [
        {
          position: 'front',
          images: [
            {
              id: '',
              x: 0.5,
              y: 0.5,
              scale: 1,
              angle: 0,
            },
          ],
        },
      ],
      background: '#ffffff',
    },
    {
      variant_ids: [103806],
      placeholders: [
        {
          position: 'front',
          images: [
            {
              id: '',
              x: 0.5,
              y: 0.5,
              scale: 1,
              angle: 0,
            },
          ],
        },
      ],
      background: '#ffffff',
    },
    {
      variant_ids: [103807],
      placeholders: [
        {
          position: 'front',
          images: [
            {
              id: '',
              x: 0.5,
              y: 0.5,
              scale: 1,
              angle: 0,
            },
          ],
        },
      ],
      background: '#ffffff',
    },
  ],
};

export const laptopSleeveConfig = {
  print_provider_id: Number(process.env.LAPTOP_SLEEVE_PRINT_PROVIDER_ID) || 0,
  blueprint_id: Number(process.env.LAPTOP_SLEEVE_PRINTIFY_BLUEPRINT_ID) || 0,
  variants: [
    {
      id: 62037,
      sku: '94066859825860771447',
      price: 2865,
      is_enabled: true,
      is_default: true,
    },
    {
      id: 62038,
      sku: '22467621504024213655',
      price: 2865,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 62039,
      sku: '11183115053661894802',
      price: 2865,
      is_enabled: true,
      is_default: false,
    },
  ],
  print_areas: [
    {
      variant_ids: [62037, 62038, 62039],
      placeholders: [
        {
          position: 'front',
          images: [
            {
              id: '',
              x: 0.5,
              y: 0.5,
              scale: 0.9854166666666666,
              angle: 0,
            },
          ],
        },
      ],
      background: '#ffffff',
    },
  ],
};

export const lunchBagConfig = {
  print_provider_id: Number(process.env.LUNCH_BAG_PRINT_PROVIDER_ID) || 0,
  blueprint_id: Number(process.env.LUNCH_BAG_PRINTIFY_BLUEPRINT_ID) || 0,
  variants: [
    {
      id: 74699,
      sku: '28632451203892685091',
      price: 5968,
      is_enabled: true,
      is_default: true,
    },
  ],
  print_areas: [
    {
      variant_ids: [74699],
      placeholders: [
        {
          position: 'front',
          images: [
            {
              id: '',
              x: 0.5000000000000036,
              y: 0.5,
              scale: 0.8931980647962059,
              angle: 0,
            },
          ],
        },
      ],
      background: '#ffffff',
    },
  ],
};

export function generateListingConfig(
  uploadedImagesArray: {
    fileId: string | null;
    response: PrintifyImageResponseType;
  }[],
  productType: string,
) {
  let config;

  switch (productType) {
    case 'desk mat':
      config = deskMatConfig;

      config.print_areas[0].placeholders[0].images[0].id =
        uploadedImagesArray.find((image) =>
          image.response.file_name.includes('9450x4650'),
        )!.response.id;

      config.print_areas[1].placeholders[0].images[0].id =
        uploadedImagesArray.find((image) =>
          image.response.file_name.includes('4320x3630'),
        )!.response.id;

      config.print_areas[2].placeholders[0].images[0].id =
        uploadedImagesArray.find((image) =>
          image.response.file_name.includes('7080x4140'),
        )!.response.id;

      return config;

    case 'laptop sleeve':
      config = laptopSleeveConfig;

      config.print_areas[0].placeholders[0].images[0].id =
        uploadedImagesArray.find((image) =>
          image.response.file_name.includes('4125x3000'),
        )!.response.id;

      return config;

    case 'lunch bag':
      config = lunchBagConfig;

      config.print_areas[0].placeholders[0].images[0].id =
        uploadedImagesArray.find((image) =>
          image.response.file_name.includes('1401x1085'),
        )!.response.id;

      return config;

    default:
      throw new Error('Invalid product type');
  }
}
