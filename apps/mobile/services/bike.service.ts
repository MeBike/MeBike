import type { Result } from "@lib/result";
import type { z } from "zod";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { toSearchParams } from "@services/shared/search-params";

import type { BikeSummary } from "@/contracts/server";

import type { BikeError } from "./bike-error";

import { asNetworkError, parseBikeError } from "./bike-error";

type BikeListQuery = z.infer<typeof ServerRoutes.bikes.listBikes.request.query>;
type BikeListResponse = z.infer<
  typeof ServerRoutes.bikes.listBikes.responses[200]["content"]["application/json"]["schema"]
>;

type BikeList = {
  data: BikeSummary[];
  pagination: BikeListResponse["pagination"];
};

export type GetAllBikesQueryParams = BikeListQuery;

async function decodeBikeResponse<TValue>(
  response: Response,
  schema: z.ZodType<TValue>,
): Promise<Result<TValue, BikeError>> {
  try {
    const data = await readJson(response);
    const parsed = decodeWithSchema(schema, data);
    return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
  }
  catch {
    return err({ _tag: "DecodeError" });
  }
}

export const bikeService = {
  reportBrokenBike: async (id: string): Promise<Result<BikeSummary, BikeError>> => {
    try {
      const path = routePath(ServerRoutes.bikes.reportBrokenBike, { id });
      const response = await kyClient.post(path, { throwHttpErrors: false });

      if (response.status === 200) {
        const okSchema = ServerRoutes.bikes.reportBrokenBike.responses[200].content["application/json"].schema;
        return decodeBikeResponse(response, okSchema as z.ZodType<BikeSummary>);
      }

      return err(await parseBikeError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
  getBikeByIdForAll: async (id: string): Promise<Result<BikeSummary, BikeError>> => {
    try {
      const path = routePath(ServerRoutes.bikes.getBike, { id });
      const response = await kyClient.get(path, { throwHttpErrors: false });

      if (response.status === 200) {
        const okSchema = ServerRoutes.bikes.getBike.responses[200].content["application/json"].schema;
        return decodeBikeResponse(response, okSchema as z.ZodType<BikeSummary>);
      }

      return err(await parseBikeError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
  getAllBikes: async (params: Partial<GetAllBikesQueryParams>): Promise<Result<BikeList, BikeError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.bikes.listBikes), {
        searchParams: toSearchParams(params),
        throwHttpErrors: false,
      });

      if (response.status === 200) {
        const okSchema = ServerRoutes.bikes.listBikes.responses[200].content["application/json"].schema;
        const result = await decodeBikeResponse(response, okSchema as z.ZodType<BikeListResponse>);

        return result.ok
          ? ok({ data: result.value.data, pagination: result.value.pagination })
          : result;
      }

      return err(await parseBikeError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};
