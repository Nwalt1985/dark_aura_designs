import { z } from 'zod';

export const PromptResponse = z.object({
  prompt: z.string(),
  description: z.string(),
  theme: z.string(),
  style: z.string(),
  title: z.string(),
  filename: z.string(),
  keywords: z.array(z.string()),
  createdAt: z.string(),
  listedAt: z.string().optional(),
  buffer: z.string().optional(),
  etsyListingId: z.number().optional(),
});

export type PromptResponseType = z.infer<typeof PromptResponse>;
