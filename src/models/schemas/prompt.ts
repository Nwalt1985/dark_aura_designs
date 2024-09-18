import { z } from 'zod';

export const PromptResponse = z.array(
  z.object({
    prompt: z.string(),
    description: z.string(),
    theme: z.string(),
    style: z.string(),
    title: z.string(),
    filename: z.string(),
    keywords: z.array(z.string()),
    createdAt: z.string(),
    buffer: z.string().optional(),
  }),
);
