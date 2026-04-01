import type { Result } from "@lib/result";
import type { z } from "zod";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { StatusCodes } from "http-status-codes";

import { ServerContracts } from "@mebike/shared";

import type { WalletError as WalletTopupError } from "@services/wallets/wallet-error";

import { asNetworkError, parseWalletError as parseWalletTopupError } from "@services/wallets/wallet-error";

export type StripeTopupSession = {
  paymentAttemptId: string;
  checkoutUrl: string;
};

export type StripeTopupPaymentSheet = {
  paymentAttemptId: string;
  paymentIntentClientSecret: string;
};

export type CreateStripeTopupSessionInput = {
  amount: string;
  currency?: "vnd";
  successUrl: string;
  cancelUrl: string;
};

async function decodeTopupResponse<TValue, TMapped>(
  response: Response,
  schema: z.ZodType<TValue>,
  map: (value: TValue) => TMapped,
): Promise<Result<TMapped, WalletTopupError>> {
  try {
    const data = await readJson(response);
    const parsed = decodeWithSchema(schema, data);
    return parsed.ok ? ok(map(parsed.value)) : err({ _tag: "DecodeError" });
  }
  catch {
    return err({ _tag: "DecodeError" });
  }
}

export const walletTopupService = {
  createStripeCheckoutSession: async (
    input: CreateStripeTopupSessionInput,
  ): Promise<Result<StripeTopupSession, WalletTopupError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.wallets.createStripeTopupSession), {
        json: {
          amount: input.amount,
          currency: input.currency ?? "vnd",
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
        },
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        return decodeTopupResponse(
          response,
          ServerContracts.WalletsContracts.StripeTopupSessionResponseSchema,
          value => ({
            paymentAttemptId: value.data.paymentAttemptId,
            checkoutUrl: value.data.checkoutUrl,
          }),
        );
      }

      return err(await parseWalletTopupError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  createStripePaymentSheet: async (
    input: Pick<CreateStripeTopupSessionInput, "amount" | "currency">,
  ): Promise<Result<StripeTopupPaymentSheet, WalletTopupError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.wallets.createStripeTopupPaymentSheet), {
        json: {
          amount: input.amount,
          currency: input.currency ?? "vnd",
        },
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        return decodeTopupResponse(
          response,
          ServerContracts.WalletsContracts.StripeTopupPaymentSheetResponseSchema,
          value => ({
            paymentAttemptId: value.data.paymentAttemptId,
            paymentIntentClientSecret: value.data.paymentIntentClientSecret,
          }),
        );
      }

      return err(await parseWalletTopupError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};
