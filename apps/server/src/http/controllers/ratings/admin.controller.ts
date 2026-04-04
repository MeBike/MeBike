import type { RouteHandler } from "@hono/zod-openapi";
import type { RatingsContracts } from "@mebike/shared";

import { Effect, Match, Option } from "effect";

import { RatingServiceTag } from "@/domain/ratings/services/rating.service";
import { withLoggedCause } from "@/domain/shared";
import {
  toAdminRatingDetail,
  toAdminRatingListItem,
} from "@/http/presenters/ratings.presenter";
import { toContractPage } from "@/http/shared/pagination";

import type { RatingsRoutes } from "./shared";

import {
  AdminRatingErrorCodeSchema,
  adminRatingErrorMessages,
} from "./shared";

const adminListRatings: RouteHandler<RatingsRoutes["adminList"]> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* RatingServiceTag;
      return yield* service.listForAdmin(
        {
          userId: query.userId,
          rentalId: query.rentalId,
          bikeId: query.bikeId,
          stationId: query.stationId,
        },
        {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 50,
          sortBy: query.sortBy ?? "createdAt",
          sortDir: query.sortDir ?? "desc",
        },
      );
    }),
    "GET /v1/admin/ratings",
  );

  const value = await c.var.runPromise(eff);

  return c.json<RatingsContracts.ListAdminRatingsResponse, 200>(
    {
      data: value.items.map(toAdminRatingListItem),
      pagination: toContractPage(value),
    },
    200,
  );
};

const adminGetRating: RouteHandler<RatingsRoutes["adminGet"]> = async (c) => {
  const { ratingId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.flatMap(RatingServiceTag, svc => svc.getAdminDetailById(ratingId)),
    "GET /v1/admin/ratings/{ratingId}",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      if (Option.isNone(right)) {
        return c.json<RatingsContracts.AdminRatingErrorResponse, 404>(
          {
            error: adminRatingErrorMessages.RATING_NOT_FOUND,
            details: {
              code: AdminRatingErrorCodeSchema.enum.RATING_NOT_FOUND,
              ratingId,
            },
          },
          404,
        );
      }

      return c.json<RatingsContracts.AdminRatingDetailResponse, 200>(
        toAdminRatingDetail(right.value),
        200,
      );
    }),
    Match.tag("Left", ({ left }) => {
      throw left;
    }),
    Match.orElse(() => {
      throw new Error("Unexpected admin rating result state");
    }),
  );
};

export const RatingAdminController = {
  adminListRatings,
  adminGetRating,
} as const;
