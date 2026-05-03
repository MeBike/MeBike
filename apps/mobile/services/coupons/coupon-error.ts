import type { z } from "zod";

import { ServerContracts } from "@mebike/shared";

import type { Result } from "@lib/result";
import type { ServiceError } from "@services/shared/service-error";

import { asNetworkError as asSharedNetworkError, normalizeServiceErrorCode, parseServiceError } from "@services/shared/service-error";

type ContractCouponRuleErrorCode = z.infer<
  typeof ServerContracts.CouponsContracts.CouponRuleErrorCodeSchema
>;

export type CouponRuleErrorCode = ContractCouponRuleErrorCode | "UNAUTHORIZED" | "FORBIDDEN" | "UNKNOWN";

export type CouponRuleError = ServiceError<CouponRuleErrorCode>;

function isCouponRuleContractErrorCode(code: string): code is ContractCouponRuleErrorCode {
  return ServerContracts.CouponsContracts.CouponRuleErrorCodeSchema.safeParse(code).success;
}

export async function parseCouponRuleError(response: Response): Promise<CouponRuleError> {
  return parseServiceError(response, {
    schema: ServerContracts.CouponsContracts.CouponRuleErrorResponseSchema,
    mapCode: code => normalizeServiceErrorCode(code, isCouponRuleContractErrorCode),
  });
}

export function asNetworkError(error: unknown): Result<never, CouponRuleError> {
  return asSharedNetworkError<Extract<CouponRuleError, { _tag: "NetworkError" }>>(error);
}
