import type { RouteHandler } from "@hono/zod-openapi";
import type { AgencyRequestsContracts } from "@mebike/shared";

import { serverRoutes } from "@mebike/shared";
import { Effect, Match } from "effect";

import { AgencyRequestServiceTag } from "@/domain/agency-requests";
import { withLoggedCause } from "@/domain/shared";
import { toAgencyRequest } from "@/http/presenters/agency-requests.presenter";
import { routeContext } from "@/http/shared/route-context";

import type {
  AgencyRequestErrorResponse,
  AgencyRequestsRoutes,
} from "./shared";

import { AgencyRequestErrorCodeSchema, agencyRequestErrorMessages } from "./shared";

const agencyRequests = serverRoutes.agencyRequests;

const submit: RouteHandler<AgencyRequestsRoutes["submit"]> = async (c) => {
  const body = c.req.valid("json");
  const requesterUserId = c.var.currentUser?.userId ?? null;

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AgencyRequestServiceTag;
      return yield* service.submit({
        requesterUserId,
        requesterEmail: body.requesterEmail,
        requesterPhone: body.requesterPhone ?? null,
        agencyName: body.agencyName,
        agencyAddress: body.agencyAddress ?? null,
        agencyContactPhone: body.agencyContactPhone ?? null,
        stationName: body.stationName,
        stationAddress: body.stationAddress,
        stationLatitude: body.stationLatitude,
        stationLongitude: body.stationLongitude,
        stationTotalCapacity: body.stationTotalCapacity,
        stationReturnSlotLimit: body.stationReturnSlotLimit ?? null,
        description: body.description ?? null,
      });
    }),
    routeContext(agencyRequests.submit),
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<AgencyRequestsContracts.SubmitAgencyRequestResponse, 201>(
        toAgencyRequest(right),
        201,
      )),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("StationLocationAlreadyExists", ({ address, latitude, longitude }) =>
          c.json<AgencyRequestErrorResponse, 400>({
            error: agencyRequestErrorMessages.STATION_LOCATION_ALREADY_EXISTS,
            details: {
              code: AgencyRequestErrorCodeSchema.enum.STATION_LOCATION_ALREADY_EXISTS,
              address,
              latitude,
              longitude,
            },
          }, 400)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

export const AgencyRequestsPublicController = {
  submit,
} as const;
