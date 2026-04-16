import type { RouteHandler } from "@hono/zod-openapi";
import type { AgencyRequestsContracts } from "@mebike/shared";

import { serverRoutes } from "@mebike/shared";
import { Effect } from "effect";

import { AgencyRequestServiceTag } from "@/domain/agency-requests";
import { withLoggedCause } from "@/domain/shared";
import { toAgencyRequest } from "@/http/presenters/agency-requests.presenter";
import { routeContext } from "@/http/shared/route-context";

import type { AgencyRequestsRoutes } from "./shared";

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

  const result = await c.var.runPromise(eff);
  return c.json<AgencyRequestsContracts.SubmitAgencyRequestResponse, 201>(
    toAgencyRequest(result),
    201,
  );
};

export const AgencyRequestsPublicController = {
  submit,
} as const;
