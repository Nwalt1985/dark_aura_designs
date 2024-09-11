import { z } from 'zod';

export const PromptResponse = z.array(
  z.object({
    prompt: z.string(),
    description: z.string(),
    title: z.string(),
    keywords: z.array(z.string()),
  }),
);
