import type { Result } from "@lib/result";
import type { z } from "zod";

import { ServerRoutes } from "@lib/server-routes";
import { ServerContracts } from "@mebike/shared";
import {
  type ServiceError,
  asNetworkError as asSharedNetworkError,
  isServiceErrorCode,
  normalizeServiceErrorCode,
  parseServiceError,
} from "@services/shared/service-error";

type ContractStationErrorCode = z.infer<typeof ServerContracts.StationsContracts.StationErrorCodeSchema>;

export type StationErrorCode = ContractStationErrorCode | "UNAUTHORIZED" | "UNKNOWN";

export type StationError = ServiceError<StationErrorCode>;

export function isStationContractErrorCode(code: string): code is ContractStationErrorCode {
  return ServerContracts.StationsContracts.StationErrorCodeSchema.safeParse(code).success;
}

export function isStationErrorCode(code: string): code is StationErrorCode {
  return isServiceErrorCode(code, isStationContractErrorCode);
}

export function isStationApiError(
  error: { _tag: string; code?: string },
): error is Extract<StationError, { _tag: "ApiError" }> {
  return error._tag === "ApiError"
    && typeof error.code === "string"
    && isStationErrorCode(error.code);
}

export async function parseStationError(response: Response): Promise<StationError> {
  return parseServiceError(response, {
    schema: ServerRoutes.stations.listStations.responses[400].content["application/json"].schema,
    mapCode: code => normalizeServiceErrorCode(code, isStationContractErrorCode),
  });
}

export function asNetworkError(error: unknown): Result<never, StationError> {
  return asSharedNetworkError<Extract<StationError, { _tag: "NetworkError" }>>(error);
}
