import type { Result } from "@lib/result";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { ServerContracts } from "@mebike/shared";
import { StatusCodes } from "http-status-codes";

export type WalletDetail = ServerContracts.WalletsContracts.WalletDetail;
export type WalletTransactionDetail = ServerContracts.WalletsContracts.WalletTransactionDetail;
export type ListMyWalletTransactionsResponse = ServerContracts.WalletsContracts.ListMyWalletTransactionsResponse;

export type WalletError
  = | { _tag: "ApiError"; code: string; message?: string }
    | { _tag: "NetworkError"; message?: string }
    | { _tag: "DecodeError" }
    | { _tag: "UnknownError"; message?: string };

function toSearchParams(params: Record<string, unknown> | undefined): Record<string, string> | undefined {
  if (!params) {
    return undefined;
  }
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [key, String(value)]);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export function walletErrorMessage(error: WalletError): string {
  if (error._tag === "ApiError") {
    return error.message ?? "Yeu cau khong hop le";
  }
  if (error._tag === "NetworkError") {
    return "Khong the ket noi toi may chu.";
  }
  return "Da co loi xay ra. Vui long thu lai.";
}

async function parseWalletError(response: Response): Promise<WalletError> {
  try {
    const data = await readJson(response);
    const parsed = decodeWithSchema(ServerContracts.WalletsContracts.WalletErrorResponseSchema, data);
    if (parsed.ok) {
      return {
        _tag: "ApiError",
        code: parsed.value.details.code,
        message: parsed.value.error,
      };
    }

    const unauthorized = decodeWithSchema(ServerContracts.UnauthorizedErrorResponseSchema, data);
    if (unauthorized.ok) {
      return {
        _tag: "ApiError",
        code: unauthorized.value.details.code,
        message: unauthorized.value.error,
      };
    }

    return { _tag: "DecodeError" };
  }
  catch (error) {
    return {
      _tag: "UnknownError",
      message: error instanceof Error ? error.message : undefined,
    };
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
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(parsed.value.data) : err({ _tag: "DecodeError" });
      }

      return err(await parseWalletError(response));
    }
    catch (error) {
      return err({
        _tag: "NetworkError",
        message: error instanceof Error ? error.message : undefined,
      });
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
        const data = await readJson(response);
        const parsed = decodeWithSchema(okSchema, data);
        return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
      }

      return err(await parseWalletError(response));
    }
    catch (error) {
      return err({
        _tag: "NetworkError",
        message: error instanceof Error ? error.message : undefined,
      });
    }
  },
};
