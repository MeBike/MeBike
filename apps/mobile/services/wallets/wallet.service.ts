import type { Result } from "@lib/result";
import type { ServerContracts } from "@mebike/shared";
import type { z } from "zod";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { toSearchParams } from "@services/shared/search-params";
import { StatusCodes } from "http-status-codes";

import type { WalletError } from "./wallet-error";

import { asNetworkError, parseWalletError } from "./wallet-error";

export type WalletDetail = ServerContracts.WalletsContracts.WalletDetail;
export type WalletTransactionDetail = ServerContracts.WalletsContracts.WalletTransactionDetail;
export type ListMyWalletTransactionsResponse = ServerContracts.WalletsContracts.ListMyWalletTransactionsResponse;
export type WalletWithdrawalDetail = ServerContracts.WalletsContracts.WalletWithdrawalDetail;
export type ListMyWalletWithdrawalsResponse = ServerContracts.WalletsContracts.ListMyWalletWithdrawalsResponse;
export type StripeConnectOnboardingResult = {
  accountId: string;
  onboardingUrl: string;
};

export type CreateWalletWithdrawalInput = {
  amount: string;
  currency?: "vnd";
  idempotencyKey?: string;
};

export type StartStripeConnectOnboardingInput = {
  returnUrl: string;
  refreshUrl: string;
};

async function decodeWalletResponse<TValue>(
  response: Response,
  schema: z.ZodType<TValue>,
): Promise<Result<TValue, WalletError>> {
  try {
    const data = await readJson(response);
    const parsed = decodeWithSchema(schema, data);
    return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
  }
  catch {
    return err({ _tag: "DecodeError" });
  }
}

export const walletServiceV1 = {
  getMyWallet: async (): Promise<Result<WalletDetail, WalletError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.wallets.getMyWallet), {
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.wallets.getMyWallet.responses[200].content["application/json"].schema;
        return decodeWalletResponse(response, okSchema as z.ZodType<WalletDetail>);
      }

      return err(await parseWalletError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  listMyWalletTransactions: async (params: {
    page?: number;
    pageSize?: number;
  }): Promise<Result<ListMyWalletTransactionsResponse, WalletError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.wallets.listMyWalletTransactions), {
        searchParams: toSearchParams(params),
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.wallets.listMyWalletTransactions.responses[200].content["application/json"].schema;
        return decodeWalletResponse(response, okSchema as z.ZodType<ListMyWalletTransactionsResponse>);
      }

      return err(await parseWalletError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  listMyWalletWithdrawals: async (params: {
    page?: number;
    pageSize?: number;
  }): Promise<Result<ListMyWalletWithdrawalsResponse, WalletError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.wallets.listMyWalletWithdrawals), {
        searchParams: toSearchParams(params),
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.wallets.listMyWalletWithdrawals.responses[200].content["application/json"].schema;
        return decodeWalletResponse(response, okSchema as z.ZodType<ListMyWalletWithdrawalsResponse>);
      }

      return err(await parseWalletError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  createWalletWithdrawal: async (
    input: CreateWalletWithdrawalInput,
  ): Promise<Result<WalletWithdrawalDetail, WalletError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.wallets.createWalletWithdrawal), {
        json: {
          amount: input.amount,
          currency: input.currency ?? "vnd",
          ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
        },
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.wallets.createWalletWithdrawal.responses[200].content["application/json"].schema;
        return decodeWalletResponse(response, okSchema as z.ZodType<WalletWithdrawalDetail>);
      }

      return err(await parseWalletError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  startStripeConnectOnboarding: async (
    input: StartStripeConnectOnboardingInput,
  ): Promise<Result<StripeConnectOnboardingResult, WalletError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.stripe.startStripeConnectOnboarding), {
        json: {
          returnUrl: input.returnUrl,
          refreshUrl: input.refreshUrl,
        },
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.stripe.startStripeConnectOnboarding.responses[200].content["application/json"].schema;
        const decoded = await decodeWalletResponse(
          response,
          okSchema as z.ZodType<ServerContracts.StripeContracts.StripeConnectOnboardingResponse>,
        );

        if (!decoded.ok) {
          return decoded;
        }

        return ok({
          accountId: decoded.value.data.accountId,
          onboardingUrl: decoded.value.data.onboardingUrl,
        });
      }

      return err(await parseWalletError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};
