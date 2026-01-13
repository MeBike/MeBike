import type { Result } from "@lib/result";
import type { z } from "zod";

import { err, ok } from "@lib/result";

export async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  }
  catch {
    return undefined;
  }
}

export function decodeWithSchema<T>(
  schema: z.ZodType<T>,
  data: unknown,
): Result<T, { _tag: "DecodeError" }> {
  const parsed = schema.safeParse(data);
  return parsed.success ? ok(parsed.data) : err({ _tag: "DecodeError" });
}
