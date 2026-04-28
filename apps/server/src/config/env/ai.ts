import { z } from "zod";

import { BooleanStringSchema, CsvStringArraySchema } from "./shared";

export const aiEnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_SITE_URL: z.string().url().optional(),
  OPENROUTER_APP_NAME: z.string().default("MeBike"),
  AI_MODEL: z.string().default("moonshotai/kimi-k2.5"),
  OPENROUTER_PROVIDER_ONLY: CsvStringArraySchema.default(["moonshotai"]),
  OPENROUTER_PROVIDER_QUANTIZATIONS: CsvStringArraySchema.default(["int4"]),
  OPENROUTER_ALLOW_FALLBACKS: BooleanStringSchema.default(false),
});
