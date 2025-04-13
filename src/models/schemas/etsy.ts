import { z } from 'zod';

export const EtsyListingSchema = z.object({
  listing_id: z.number(),
  user_id: z.number(),
  shop_id: z.number(),
  title: z.string(),
  description: z.string(),
  state: z.string(),
  creation_timestamp: z.number(),
  created_timestamp: z.number(),
  ending_timestamp: z.number(),
  original_creation_timestamp: z.number(),
  last_modified_timestamp: z.number(),
  updated_timestamp: z.number(),
  state_timestamp: z.number(),
  quantity: z.number(),
  shop_section_id: z.number(),
  featured_rank: z.number(),
  url: z.string(),
  num_favorers: z.number(),
  non_taxable: z.boolean(),
  is_taxable: z.boolean(),
  is_customizable: z.boolean(),
  is_personalizable: z.boolean(),
  personalization_is_required: z.boolean(),
  personalization_char_count_max: z.number().nullable(),
  personalization_instructions: z.string().nullable(),
  listing_type: z.string(),
  tags: z.array(z.string()),
  materials: z.array(z.string()),
  shipping_profile_id: z.number(),
  return_policy_id: z.number(),
  processing_min: z.number(),
  processing_max: z.number(),
  who_made: z.string(),
  when_made: z.string(),
  is_supply: z.boolean(),
  item_weight: z.number().nullable(),
  item_weight_unit: z.string().nullable(),
  item_length: z.number().nullable(),
  item_width: z.number().nullable(),
  item_height: z.number().nullable(),
  item_dimensions_unit: z.string().nullable(),
  is_private: z.boolean(),
  style: z.array(z.string()),
  file_data: z.string(),
  has_variations: z.boolean(),
  should_auto_renew: z.boolean(),
  language: z.string(),
  price: z.object({
    amount: z.number(),
    divisor: z.number(),
    currency_code: z.string(),
  }),
  taxonomy_id: z.number(),
  production_partners: z.array(
    z.object({
      production_partner_id: z.number(),
      partner_name: z.string(),
      location: z.string(),
    }),
  ),
  skus: z.array(z.string()),
  views: z.number(),
});

export const EtsyListingRequestSchema = z.array(z.string()).max(13);

export type EtsyListingType = z.infer<typeof EtsyListingSchema>;

export const EtsyInventorySchema = z.object({
  products: z.array(
    z.object({
      product_id: z.number().optional(),
      sku: z.string(),
      is_deleted: z.boolean().optional(),
      offerings: z.array(
        z.object({
          offering_id: z.number().optional(),
          quantity: z.number(),
          is_enabled: z.boolean(),
          is_deleted: z.boolean().optional(),
          price: z.object({
            amount: z.number(),
            divisor: z.number(),
            currency_code: z.string(),
          }),
          property_values: z
            .array(
              z.object({
                property_id: z.number(),
                property_name: z.string(),
                scale_id: z.number().nullable(),
                scale_name: z.string().nullable(),
                value_ids: z.array(z.number()),
                values: z.array(z.string()),
              }),
            )
            .optional(),
        }),
      ),
      property_values: z.array(
        z.object({
          property_id: z.number(),
          property_name: z.string(),
          scale_id: z.number().nullable(),
          scale_name: z.string().nullable(),
          value_ids: z.array(z.number()),
          values: z.array(z.string()),
        }),
      ),
    }),
  ),
  price_on_property: z.array(z.number()),
  quantity_on_property: z.array(z.number()),
  sku_on_property: z.array(z.number()),
  listing: z.null(),
});

export type EtsyInventoryType = z.infer<typeof EtsyInventorySchema>;

export const EtsyInventoryUpdateSchema = z.object({
  products: z.array(
    z.object({
      sku: z.string(),
      offerings: z.array(
        z.object({
          quantity: z.number(),
          is_enabled: z.boolean(),
          price: z.number(),
        }),
      ),
      property_values: z.array(
        z.object({
          property_id: z.number(),
          property_name: z.string(),
          scale_id: z.number().nullable(),
          value_ids: z.array(z.number()),
          values: z.array(z.string()),
        }),
      ),
    }),
  ),
  price_on_property: z.array(z.number()),
  quantity_on_property: z.array(z.number()),
  sku_on_property: z.array(z.number()),
});

export type EtsyInventoryUpdateType = z.infer<typeof EtsyInventoryUpdateSchema>;
