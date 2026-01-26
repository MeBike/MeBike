import type { ZodType } from "zod";

import { log } from "@lib/logger";

type ParseContext = {
  op: string;
};

type ParseResult<T>
  = | {
    success: true;
    data: T;
  }
  | {
    success: false;
    data: T;
  };

function getFingerprint(input: unknown) {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return Object.keys(input as Record<string, unknown>).slice(0, 8);
  }
  if (Array.isArray(input)) {
    return [`array(${input.length})`];
  }
  return [typeof input];
}

export function parseOrWarn<T>(
  schema: ZodType<T>,
  input: unknown,
  context: ParseContext,
  fallback: T,
): ParseResult<T> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const issues = result.error.issues.slice(0, 5).map(issue => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

  log.warn("[ZOD] Shape mismatch", {
    op: context.op,
    issues,
    fingerprint: getFingerprint(input),
  });

  return { success: false, data: fallback };
}
