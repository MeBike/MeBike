import type { Result } from "@lib/result";
import type { z } from "zod";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { toSearchParams } from "@services/shared/search-params";
import { StatusCodes } from "http-status-codes";

import type { StationListResponse, StationReadSummary } from "@/contracts/server";

import type { StationError } from "./station-error";

import { asNetworkError, parseStationError } from "./station-error";

type StationListQuery = z.infer<
  typeof ServerRoutes.stations.listStations.request.query
>;
type NearbyStationsQuery = z.infer<
  typeof ServerRoutes.stations.getNearbyStations.request.query
>;
type NearbyStationsOptions = Omit<NearbyStationsQuery, "latitude" | "longitude">;

export const stationService = {
  getAllStations: async (params?: StationListQuery): Promise<Result<StationReadSummary[], StationError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.stations.listStations), {
        searchParams: toSearchParams(params),
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.stations.listStations.responses[200].content["application/json"].schema;
        const result = await decodeStationResponse(response, okSchema as z.ZodType<StationListResponse>);
        return result.ok ? ok(result.value.data) : result;
      }

      return err(await parseStationError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
  getStationById: async (stationId: string): Promise<Result<StationReadSummary, StationError>> => {
    try {
      const path = routePath(ServerRoutes.stations.getStation, { stationId });
      const response = await kyClient.get(path, { throwHttpErrors: false });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.stations.getStation.responses[200].content["application/json"].schema;
        return decodeStationResponse(response, okSchema as z.ZodType<StationReadSummary>);
      }

      return err(await parseStationError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
  getNearMe: async (
    latitude: number,
    longitude: number,
    options?: NearbyStationsOptions,
  ): Promise<Result<StationReadSummary[], StationError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.stations.getNearbyStations), {
        searchParams: toSearchParams({
          latitude,
          longitude,
          ...options,
        }),
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        const okSchema = ServerRoutes.stations.getNearbyStations.responses[200].content["application/json"].schema;
        const result = await decodeStationResponse(response, okSchema as z.ZodType<StationListResponse>);
        return result.ok ? ok(result.value.data) : result;
      }

      return err(await parseStationError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};

async function decodeStationResponse<TValue>(
  response: Response,
  schema: z.ZodType<TValue>,
): Promise<Result<TValue, StationError>> {
  try {
    const data = await readJson(response);
    const parsed = decodeWithSchema(schema, data);
    return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
  }
  catch {
    return err({ _tag: "DecodeError" });
  }
}
