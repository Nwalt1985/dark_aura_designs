import { z } from 'zod';

export const PrintifyImageResponse = z.object({
  id: z.string(),
  file_name: z.string(),
  height: z.number(),
  width: z.number(),
  size: z.number(),
  mime_type: z.string(),
  preview_url: z.string(),
  upload_time: z.string(),
});

export type PrintifyImageResponseType = z.infer<typeof PrintifyImageResponse>;

export const PrintifyGetUploadsResponse = z.object({
  current_page: z.number(),
  data: PrintifyImageResponse.array(),
  first_page_url: z.string(),
  from: z.number(),
  last_page: z.number(),
  last_page_url: z.string(),
  next_page_url: z.string().nullable(),
  path: z.string(),
  per_page: z.number(),
  prev_page_url: z.string().nullable(),
  to: z.number(),
  total: z.number(),
});

export type PrintifyGetUploadsResponseType = z.infer<
  typeof PrintifyGetUploadsResponse
>;

export const PrintifyProduct = z.object({
  title: z.string(),
  description: z.string(),
  blueprint_id: z.string(),
  print_provider_id: z.string(),
  variants: z.array(
    z.object({
      id: z.string(),
      price: z.string(),
      is_enabled: z.boolean(),
    }),
  ),
});

export const PrintifyProductUploadRequest = z.object({
  title: z.string(),
  description: z.string(),
  blueprint_id: z.number(),
  print_provider_id: z.number(),
  tags: z.array(z.string()),
  variants: z.array(
    z.object({
      id: z.number(),
      sku: z.string(),
      price: z.number(),
      is_enabled: z.boolean(),
      is_default: z.boolean(),
    }),
  ),
  print_areas: z.array(
    z.object({
      variant_ids: z.array(z.number()),
      placeholders: z.array(
        z.object({
          position: z.string(),
          images: z.array(
            z.object({
              id: z.string(),
              x: z.number(),
              y: z.number(),
              scale: z.number(),
              angle: z.number(),
            }),
          ),
        }),
      ),
      background: z.string(),
    }),
  ),
});

export type PrintifyProductUploadRequestType = z.infer<
  typeof PrintifyProductUploadRequest
>;

export const PrintifyProductUploadResponse = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  options: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      values: z.array(
        z.object({
          id: z.number(),
          title: z.string(),
        }),
      ),
    }),
  ),
  variants: z.array(
    z.object({
      id: z.number(),
      sku: z.string(),
      cost: z.number(),
      price: z.number(),
      title: z.string(),
      grams: z.number(),
      is_enabled: z.boolean(),
      is_default: z.boolean(),
      is_available: z.boolean(),
      is_printify_express_eligible: z.boolean(),
      options: z.array(z.number()),
    }),
  ),
  images: z.array(
    z.object({
      src: z.string(),
      variant_ids: z.array(z.number()),
      position: z.string(),
      is_default: z.boolean(),
    }),
  ),
  created_at: z.string(),
  updated_at: z.string(),
  visible: z.boolean(),
  is_locked: z.boolean(),
  is_printify_express_eligible: z.boolean(),
  is_printify_express_enabled: z.boolean(),
  is_economy_shipping_eligible: z.boolean(),
  is_economy_shipping_enabled: z.boolean(),
  blueprint_id: z.number(),
  user_id: z.number(),
  shop_id: z.number(),
  print_provider_id: z.number(),
  print_areas: z.array(
    z.object({
      variant_ids: z.array(z.number()),
      placeholders: z.array(
        z.object({
          position: z.string(),
          images: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              type: z.string(),
              height: z.number(),
              width: z.number(),
              x: z.number(),
              y: z.number(),
              scale: z.number(),
              angle: z.number(),
              pattern: z.object({
                spacing_x: z.number(),
                spacing_y: z.number(),
                scale: z.number(),
                offset: z.number(),
              }),
            }),
          ),
        }),
      ),
      background: z.string(),
    }),
  ),
  sales_channel_properties: z.array(z.unknown()),
});

export type PrintifyProductUploadResponseType = z.infer<
  typeof PrintifyProductUploadResponse
>;
