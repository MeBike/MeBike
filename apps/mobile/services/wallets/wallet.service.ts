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
