import dotenv from 'dotenv';
import { PrintifyImageResponseType } from '../../models/schemas/printify';
import { BuildProductType } from '../../models/types/listing';

dotenv.config();

const placeholdersFront = {
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
};

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
      placeholders: [placeholdersFront],
      background: '#ffffff',
    },
    {
      variant_ids: [103806],
      placeholders: [placeholdersFront],
      background: '#ffffff',
    },
    {
      variant_ids: [103807],
      placeholders: [placeholdersFront],
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
      sku: '15402852538898633500',
      price: 2500,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 79312,
      sku: '32922091406078559470',
      price: 3000,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 79313,
      sku: '23293247215381687314',
      price: 3500,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 79314,
      sku: '12938115724255141288',
      price: 4000,
      is_enabled: true,
      is_default: false,
    },
    {
      id: 79315,
      sku: '14616426927730794653',
      price: 4500,
      is_enabled: true,
      is_default: true,
    },
  ],
  print_areas: [
    {
      variant_ids: [79311, 79312, 79313, 79314, 79315],
      placeholders: [placeholdersFront],
      background: '#000000',
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
    case BuildProductType.DESK_MAT:
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

    case BuildProductType.PILLOW:
      config = pillowConfig;

      config.print_areas[0].placeholders[0].images[0].id =
        uploadedImagesArray.find((image) =>
          image.response.file_name.includes('4050x4050'),
        )!.response.id;

      return config;

    default:
      throw new Error('Invalid product type');
  }
}
