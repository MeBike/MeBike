import type { Result } from "@lib/result";
import type { z } from "zod";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { ServerContracts } from "@mebike/shared";
import { StatusCodes } from "http-status-codes";

import type { WalletError } from "./wallet-error";

import { asNetworkError, parseWalletError } from "./wallet-error";

export type WalletDetail = ServerContracts.WalletsContracts.WalletDetail;
export type WalletTransactionDetail = ServerContracts.WalletsContracts.WalletTransactionDetail;
export type ListMyWalletTransactionsResponse = ServerContracts.WalletsContracts.ListMyWalletTransactionsResponse;

function toSearchParams(params: Record<string, unknown> | undefined): Record<string, string> | undefined {
  if (!params) {
    return undefined;
  }
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [key, String(value)]);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

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
};
