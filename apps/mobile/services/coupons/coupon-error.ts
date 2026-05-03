import type { Result } from "@lib/result";
import type { ServiceError } from "@services/shared/service-error";

import { readJson } from "@lib/api-decode";
import { asNetworkError as asSharedNetworkError } from "@services/shared/service-error";

export type CouponRuleErrorCode = "UNKNOWN";

export type CouponRuleError = ServiceError<CouponRuleErrorCode>;

export async function parseCouponRuleError(response: Response): Promise<CouponRuleError> {
  try {
    const data = await readJson(response) as {
      error?: unknown;
      details?: unknown;
    };

    return {
      _tag: "ApiError",
      code: "UNKNOWN",
      message: typeof data.error === "string" ? data.error : undefined,
      details: data.details && typeof data.details === "object"
        ? data.details as Record<string, unknown>
        : undefined,
    };
  }
  catch {
    return { _tag: "DecodeError" };
  }
}

export function asNetworkError(error: unknown): Result<never, CouponRuleError> {
  return asSharedNetworkError<Extract<CouponRuleError, { _tag: "NetworkError" }>>(error);
}
