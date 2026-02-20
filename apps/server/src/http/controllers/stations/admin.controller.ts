import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import { StationServiceTag } from "@/domain/stations";

import type {
  StationErrorResponse,
  StationsRoutes,
  StationSummary,
} from "./shared";

import { StationErrorCodeSchema, stationErrorMessages } from "./shared";

const createStation: RouteHandler<StationsRoutes["createStation"]> = async (c) => {
  const body = c.req.valid("json");

  const eff = Effect.flatMap(StationServiceTag, service =>
    service.createStation({
      name: body.name,
      address: body.address,
      capacity: body.capacity,
      latitude: body.latitude,
      longitude: body.longitude,
    }));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => c.json<StationSummary, 201>(right, 201)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("StationNameAlreadyExists", () =>
          c.json<StationErrorResponse, 400>({
            error: stationErrorMessages.STATION_NAME_ALREADY_EXISTS,
            details: {
              code: StationErrorCodeSchema.enum.STATION_NAME_ALREADY_EXISTS,
            },
          }, 400)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

export const StationAdminController = {
  createStation,
} as const;
