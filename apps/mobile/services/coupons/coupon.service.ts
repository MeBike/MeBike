import type { z } from "zod";

import { StatusCodes } from "http-status-codes";

import type { ActiveCouponRulesResponse } from "@/contracts/server";
import type { Result } from "@lib/result";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";

import type { CouponRuleError } from "./coupon-error";

import { asNetworkError, parseCouponRuleError } from "./coupon-error";

export type { CouponRuleError } from "./coupon-error";

async function decodeCouponRuleResponse<TValue>(
  response: Response,
  schema: z.ZodType<TValue>,
): Promise<Result<TValue, CouponRuleError>> {
  try {
    const data = await readJson(response);
    const parsed = decodeWithSchema(schema, data);
    return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
  }
  catch {
    return err({ _tag: "DecodeError" });
  }
}

export const couponRuleService = {
  listActive: async (): Promise<Result<ActiveCouponRulesResponse, CouponRuleError>> => {
    try {
      const response = await kyClient.get(
        routePath(ServerRoutes.couponRules.listActiveCouponRules),
        { throwHttpErrors: false },
      );

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.couponRules.listActiveCouponRules.responses[200].content["application/json"].schema;
        return decodeCouponRuleResponse(response, okSchema as z.ZodType<ActiveCouponRulesResponse>);
      }

      return err(await parseCouponRuleError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};
