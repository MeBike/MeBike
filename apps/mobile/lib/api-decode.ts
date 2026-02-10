import type { Result } from "@lib/result";
import type { z } from "zod";

import { log } from "@lib/log";
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
  if (!parsed.success) {
    const issues = parsed.error.issues.map(issue => ({
      path: issue.path.join("."),
      code: issue.code,
      message: issue.message,
    }));
    log.warn("Zod decode failed", { issues });
  }
  return parsed.success ? ok(parsed.data) : err({ _tag: "DecodeError" });
}
