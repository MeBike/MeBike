import type { RouteHandler } from "@hono/zod-openapi";

import {
  operatorErrorMessages,
  OperatorsContracts,
  serverRoutes,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
} from "@mebike/shared";
import { Effect } from "effect";

import { withLoggedCause } from "@/domain/shared";
import { StationQueryServiceTag } from "@/domain/stations";
import { routeContext } from "@/http/shared/route-context";

type OperatorsRoutes = typeof import("@mebike/shared")["serverRoutes"]["operators"];
const operators = serverRoutes.operators;

const getStationContext: RouteHandler<OperatorsRoutes["stationContext"]> = async (c) => {
  const currentStationId = c.var.currentUser?.operatorStationId;

  if (!c.var.currentUser) {
    return c.json(
      {
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      },
      401,
    );
  }

  if (!currentStationId) {
    return c.json<OperatorsContracts.OperatorErrorResponse, 404>(
      {
        error: operatorErrorMessages.OPERATOR_STATION_NOT_FOUND,
        details: {
          code: OperatorsContracts.OperatorErrorCodeSchema.enum.OPERATOR_STATION_NOT_FOUND,
        },
      },
      404,
    );
  }

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* StationQueryServiceTag;

      const [currentStation, otherStations] = yield* Effect.all([
        service.getStationById(currentStationId),
        service.listContextExcludingId(currentStationId),
      ]);

      return {
        currentStation: {
          id: currentStation.id,
          name: currentStation.name,
          address: currentStation.address,
        },
        otherStations: otherStations.map(station => ({
          id: station.id,
          name: station.name,
          address: station.address,
        })),
      } satisfies OperatorsContracts.OperatorStationContextResponse;
    }),
    routeContext(operators.stationContext),
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  if (result._tag === "Right") {
    return c.json<OperatorsContracts.OperatorStationContextResponse, 200>(result.right, 200);
  }

  return c.json<OperatorsContracts.OperatorErrorResponse, 404>(
    {
      error: operatorErrorMessages.OPERATOR_STATION_NOT_FOUND,
      details: {
        code: OperatorsContracts.OperatorErrorCodeSchema.enum.OPERATOR_STATION_NOT_FOUND,
        stationId: currentStationId,
      },
    },
    404,
  );
};

export const OperatorController = {
  getStationContext,
} as const;
