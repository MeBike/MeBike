import type { Result } from "@lib/result";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { ServerContracts } from "@mebike/shared";
import { toSearchParams } from "@services/shared/search-params";
import { StatusCodes } from "http-status-codes";

import type {
  EnvironmentImpactDetail,
  EnvironmentImpactHistoryQuery,
  EnvironmentImpactHistoryResponse,
  EnvironmentSummary,
} from "@/contracts/server";

import type { EnvironmentError } from "./environment-error";

import { asNetworkError, parseEnvironmentError } from "./environment-error";

function buildHistorySearchParams(params: EnvironmentImpactHistoryQuery = {}) {
  return toSearchParams({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    sortOrder: params.sortOrder,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });
}

export const environmentService = {
  async getSummary(): Promise<Result<EnvironmentSummary, EnvironmentError>> {
    try {
      const response = await kyClient.get(
        routePath(ServerRoutes.environment.getMyEnvironmentSummary),
        { throwHttpErrors: false },
      );

      if (response.status === StatusCodes.OK) {
        const data = await readJson(response);
        const parsed = decodeWithSchema(
          ServerContracts.EnvironmentContracts.EnvironmentSummarySchema,
          data,
        );
        return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
      }

      return err(await parseEnvironmentError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  async getHistory(
    params: EnvironmentImpactHistoryQuery = {},
  ): Promise<Result<EnvironmentImpactHistoryResponse, EnvironmentError>> {
    try {
      const response = await kyClient.get(
        routePath(ServerRoutes.environment.getMyEnvironmentImpactHistory),
        {
          searchParams: buildHistorySearchParams(params),
          throwHttpErrors: false,
        },
      );

      if (response.status === StatusCodes.OK) {
        const data = await readJson(response);
        const parsed = decodeWithSchema(
          ServerContracts.EnvironmentContracts.EnvironmentImpactHistoryResponseSchema,
          data,
        );
        return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
      }

      return err(await parseEnvironmentError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  async getDetail(rentalId: string): Promise<Result<EnvironmentImpactDetail, EnvironmentError>> {
    try {
      const response = await kyClient.get(
        routePath(ServerRoutes.environment.getMyEnvironmentImpactByRental, { rentalId }),
        { throwHttpErrors: false },
      );

      if (response.status === StatusCodes.OK) {
        const data = await readJson(response);
        const parsed = decodeWithSchema(
          ServerContracts.EnvironmentContracts.EnvironmentImpactDetailSchema,
          data,
        );
        return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
      }

      return err(await parseEnvironmentError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};
