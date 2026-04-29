import { z } from "zod";

import { BooleanStringSchema, CsvStringArraySchema } from "./shared";

export const aiEnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_SITE_URL: z.string().url().optional(),
  OPENROUTER_APP_NAME: z.string().default("MeBike"),
  AI_MODEL: z.string().default("deepseek/deepseek-v4-flash"),
  OPENROUTER_PROVIDER_ORDER: CsvStringArraySchema.default(["siliconflow", "deepinfra"]),
  OPENROUTER_PROVIDER_ONLY: CsvStringArraySchema.default([]),
  OPENROUTER_PROVIDER_QUANTIZATIONS: CsvStringArraySchema.default(["fp8", "fp4"]),
  OPENROUTER_ALLOW_FALLBACKS: BooleanStringSchema.default(true),
  OPENROUTER_REASONING_EFFORT: z
    .enum(["xhigh", "high", "medium", "low", "minimal", "none"])
    .default("medium"),
});
