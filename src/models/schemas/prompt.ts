import { z } from 'zod';

export const PromptResponse = z.object({
  prompts: z.array(
    z.object({
      prompt: z.string(),
      description: z.string(),
      title: z.string(),
      keywords: z.array(z.string()),
    }),
  ),
});
