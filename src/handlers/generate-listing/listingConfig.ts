import dotenv from 'dotenv';
import { PrintifyImageResponseType } from '../../models/schemas/printify';
import { ProductName } from '../../models/types/listing';
import { cloneDeep } from 'lodash';

dotenv.config();

const createPlaceholder = (): {
  position: string;
  images: Array<{ id: string; x: number; y: number; scale: number; angle: number }>;
} => ({
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
});

export const deskMatConfig = {
  print_provider_id: Number(process.env.DESK_MAT_PRINT_PROVIDER_ID) || 0,
  blueprint_id: Number(process.env.DESK_MAT_PRINTIFY_BLUEPRINT_ID) || 0,
  variants: [
    {
      id: 81075,
      price: 4200,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 103806,
      price: 3000,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 103807,
      price: 3700,
      is_enabled: true,
      is_default: true,
    },
  ],
  print_areas: [
    {
      variant_ids: [81075],
      placeholders: [createPlaceholder()],
      background: '#ffffff',
    },
    {
      variant_ids: [103806],
      placeholders: [createPlaceholder()],
      background: '#ffffff',
    },
    {
      variant_ids: [103807],
      placeholders: [createPlaceholder()],
      background: '#ffffff',
    },
  ],
};

export const pillowConfig = {
  print_provider_id: Number(process.env.PILLOW_PRINT_PROVIDER_ID) || 0,
  blueprint_id: Number(process.env.PILLOW_PRINTIFY_BLUEPRINT_ID) || 0,
  variants: [
    {
      id: 79311,
      price: 4500,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 79312,
      price: 5000,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 79313,
      price: 5500,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 79314,
      price: 6000,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 79315,
      price: 6500,
      is_enabled: true,
      is_default: true,
    },
  ],
  print_areas: [
    {
      variant_ids: [79311, 79312, 79313, 79314, 79315],
      placeholders: [createPlaceholder()],
      background: '#000000',
    },
  ],
};

export const pillowCoverConfig = {
  print_provider_id: Number(process.env.PILLOW_CASE_PRINT_PROVIDER_ID) || 0,
  blueprint_id: Number(process.env.PILLOW_CASE_PRINTIFY_BLUEPRINT_ID) || 0,
  variants: [
    {
      id: 79394,
      price: 1520,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 79395,
      price: 1575,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 79396,
      price: 1848,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 79397,
      price: 2370,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 79398,
      price: 2258,
      is_enabled: true,
      is_default: true,
    },
  ],
  print_areas: [
    {
      variant_ids: [79394, 79395, 79396, 79397, 79398],
      placeholders: [createPlaceholder()],
      background: '#000000',
    },
  ],
};

export const BlanketConfig = {
  print_provider_id: Number(process.env.BLANKET_PRINT_PROVIDER_ID) || 0,
  blueprint_id: Number(process.env.BLANKET_PRINTIFY_BLUEPRINT_ID) || 0,
  variants: [
    {
      id: 102314,
      price: 4000,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 102315,
      price: 5000,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 102316,
      price: 6000,
      is_enabled: true,
      is_default: true,
    },
  ],
  print_areas: [
    {
      variant_ids: [102316],
      placeholders: [createPlaceholder()],
      background: '#ffffff',
    },
    {
      variant_ids: [102315],
      placeholders: [createPlaceholder()],
      background: '#ffffff',
    },
    {
      variant_ids: [102314],
      placeholders: [createPlaceholder()],
      background: '#ffffff',
    },
  ],
};

export const WovenBlanketConfig = {
  print_provider_id: Number(process.env.WOVEN_BLANKET_PRINT_PROVIDER_ID) || 0,
  blueprint_id: Number(process.env.WOVEN_BLANKET_PRINTIFY_BLUEPRINT_ID) || 0,
  variants: [
    {
      id: 112797,
      price: 8500,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 112798,
      price: 9500,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 112799,
      price: 12500,
      is_enabled: true,
      is_default: true,
    },
  ],
  print_areas: [
    {
      variant_ids: [112799],
      placeholders: [createPlaceholder()],
      background: '#ffffff',
    },
    {
      variant_ids: [112798],
      placeholders: [createPlaceholder()],
      background: '#ffffff',
    },
    {
      variant_ids: [112797],
      placeholders: [createPlaceholder()],
      background: '#ffffff',
    },
  ],
};

export function generateListingConfig(
  uploadedImagesArray: {
    fileId: string | null;
    response: PrintifyImageResponseType;
  }[],
  productType: ProductName,
):
  | typeof deskMatConfig
  | typeof pillowConfig
  | typeof pillowCoverConfig
  | typeof BlanketConfig
  | typeof WovenBlanketConfig {
  let config;

  switch (productType) {
    case ProductName.DESK_MAT:
      config = cloneDeep(deskMatConfig);

      config.print_areas[0].placeholders[0].images[0].id = uploadedImagesArray.find((image) =>
        image.response.file_name.includes('9450x4650'),
      )!.response.id;

      config.print_areas[1].placeholders[0].images[0].id = uploadedImagesArray.find((image) =>
        image.response.file_name.includes('4320x3630'),
      )!.response.id;

      config.print_areas[2].placeholders[0].images[0].id = uploadedImagesArray.find((image) =>
        image.response.file_name.includes('7080x4140'),
      )!.response.id;

      return config;

    case ProductName.PILLOW_COVER:
      config = cloneDeep(pillowCoverConfig);

      config.print_areas[0].placeholders[0].images[0].id = uploadedImagesArray.find((image) =>
        image.response.file_name.includes('4050x4050'),
      )!.response.id;

      return config;
    case ProductName.PILLOW:
      config = cloneDeep(pillowConfig);

      config.print_areas[0].placeholders[0].images[0].id = uploadedImagesArray.find((image) =>
        image.response.file_name.includes('4050x4050'),
      )!.response.id;

      return config;

    case ProductName.BLANKET:
      config = cloneDeep(BlanketConfig);

      config.print_areas[0].placeholders[0].images[0].id = uploadedImagesArray.find((image) =>
        image.response.file_name.includes('8228x6260'),
      )!.response.id;

      config.print_areas[1].placeholders[0].images[0].id = uploadedImagesArray.find((image) =>
        image.response.file_name.includes('6299x5276'),
      )!.response.id;

      config.print_areas[2].placeholders[0].images[0].id = uploadedImagesArray.find((image) =>
        image.response.file_name.includes('4252x3307'),
      )!.response.id;

      return config;

    case ProductName.WOVEN_BLANKET:
      config = cloneDeep(WovenBlanketConfig);

      config.print_areas[0].placeholders[0].images[0].id = uploadedImagesArray.find((image) =>
        image.response.file_name.includes('7680x5760'),
      )!.response.id;

      config.print_areas[1].placeholders[0].images[0].id = uploadedImagesArray.find((image) =>
        image.response.file_name.includes('5760x4800'),
      )!.response.id;

      config.print_areas[2].placeholders[0].images[0].id = uploadedImagesArray.find((image) =>
        image.response.file_name.includes('4992x3552'),
      )!.response.id;

      return config;

    default:
      throw new Error('Invalid product type');
  }
}
