import type { Result } from "@lib/result";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { ServerContracts } from "@mebike/shared";
import { StatusCodes } from "http-status-codes";

export type WalletTopupErrorCode = string;

export type WalletTopupError
  = | { _tag: "ApiError"; code: WalletTopupErrorCode; message?: string }
    | { _tag: "NetworkError"; message?: string }
    | { _tag: "DecodeError" }
    | { _tag: "UnknownError"; message?: string };

export type StripeTopupSession = {
  paymentAttemptId: string;
  checkoutUrl: string;
};

export type CreateStripeTopupSessionInput = {
  amount: string;
  currency?: "usd";
  successUrl: string;
  cancelUrl: string;
};

export function walletTopupErrorMessage(error: WalletTopupError): string {
  if (error._tag === "ApiError") {
    return error.message ?? "Yeu cau khong hop le";
  }
  if (error._tag === "NetworkError") {
    return "Khong the ket noi toi may chu.";
  }
  return "Da co loi xay ra. Vui long thu lai.";
}

export async function parseWalletTopupError(response: Response): Promise<WalletTopupError> {
  try {
    const data = await readJson(response);

    if (response.status === StatusCodes.UNAUTHORIZED) {
      const parsed = decodeWithSchema(ServerContracts.UnauthorizedErrorResponseSchema, data);
      if (parsed.ok) {
        return { _tag: "ApiError", code: "UNAUTHORIZED", message: parsed.value.error };
      }
      return { _tag: "DecodeError" };
    }

    const parsed = decodeWithSchema(ServerContracts.WalletsContracts.WalletErrorResponseSchema, data);
    if (parsed.ok) {
      return {
        _tag: "ApiError",
        code: parsed.value.details.code,
        message: parsed.value.error,
      };
    }
    return { _tag: "DecodeError" };
  }
  catch {
    return { _tag: "DecodeError" };
  }
}

export function asNetworkError(error: unknown): Result<never, WalletTopupError> {
  return err({
    _tag: "NetworkError",
    message: error instanceof Error ? error.message : undefined,
  });
}

export const walletTopupService = {
  createStripeCheckoutSession: async (
    input: CreateStripeTopupSessionInput,
  ): Promise<Result<StripeTopupSession, WalletTopupError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.wallets.createStripeTopupSession), {
        json: {
          amount: input.amount,
          currency: input.currency ?? "usd",
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
        },
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const data = await readJson(response);
        const parsed = decodeWithSchema(ServerContracts.WalletsContracts.StripeTopupSessionResponseSchema, data);
        return parsed.ok
          ? ok({
              paymentAttemptId: parsed.value.data.paymentAttemptId,
              checkoutUrl: parsed.value.data.checkoutUrl,
            })
          : err({ _tag: "DecodeError" });
      }

      return err(await parseWalletTopupError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};
