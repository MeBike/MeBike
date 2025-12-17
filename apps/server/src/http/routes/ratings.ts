import { RatingsContracts, serverRoutes, UnauthorizedErrorCodeSchema, unauthorizedErrorMessages } from "@mebike/shared";
import { Effect, Match } from "effect";

import {
  createRatingWithGuardsUseCase,
  getRatingByRentalIdUseCase,
} from "@/domain/ratings";
import { withLoggedCause } from "@/domain/shared";
import { withRatingDeps } from "@/http/shared/providers";

export function registerRatingRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const ratings = serverRoutes.ratings;
  const { ratingErrorMessages, RatingErrorCodeSchema } = RatingsContracts;

  app.openapi(ratings.create, async (c) => {
    const userId = c.var.currentUser?.userId ?? null;
    if (!userId) {
      return c.json({
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      }, 401);
    }

    const { rentalId } = c.req.valid("param");
    const body = c.req.valid("json");

    const eff = withLoggedCause(
      withRatingDeps(createRatingWithGuardsUseCase({
        rentalId,
        userId,
        rating: body.rating,
        reasonIds: body.reasonIds,
        comment: body.comment ?? null,
      })),
      "POST /v1/ratings/{rentalId}",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<RatingsContracts.CreateRatingResponse, 201>(
          { data: mapRatingDetail(right) },
          201,
        )),
      Match.tag("Left", ({ left }) => Match.value(left).pipe(
        Match.tag("CannotRateUncompletedRental", () =>
          c.json<RatingsContracts.RatingErrorResponse, 400>({
            error: ratingErrorMessages.RENTAL_NOT_COMPLETED,
            details: { code: RatingErrorCodeSchema.enum.RENTAL_NOT_COMPLETED },
          }, 400)),
        Match.tag("RatingExpired", () =>
          c.json<RatingsContracts.RatingErrorResponse, 400>({
            error: ratingErrorMessages.RATING_EXPIRED,
            details: { code: RatingErrorCodeSchema.enum.RATING_EXPIRED },
          }, 400)),
        Match.tag("RatingReasonNotFound", () =>
          c.json<RatingsContracts.RatingErrorResponse, 400>({
            error: ratingErrorMessages.RATING_REASON_NOT_FOUND,
            details: { code: RatingErrorCodeSchema.enum.RATING_REASON_NOT_FOUND },
          }, 400)),
        Match.tag("CannotRateOthersRental", () =>
          c.json<RatingsContracts.RatingErrorResponse, 403>({
            error: ratingErrorMessages.UNAUTHORIZED_RENTAL_ACCESS,
            details: { code: RatingErrorCodeSchema.enum.UNAUTHORIZED_RENTAL_ACCESS },
          }, 403)),
        Match.tag("RatingAlreadyExists", () =>
          c.json<RatingsContracts.RatingErrorResponse, 409>({
            error: ratingErrorMessages.RATING_ALREADY_EXISTS,
            details: { code: RatingErrorCodeSchema.enum.RATING_ALREADY_EXISTS },
          }, 409)),
        Match.tag("RentalNotFound", () =>
          c.json<RatingsContracts.RatingErrorResponse, 404>({
            error: ratingErrorMessages.RENTAL_NOT_FOUND,
            details: { code: RatingErrorCodeSchema.enum.RENTAL_NOT_FOUND },
          }, 404)),
        Match.tag("UnauthorizedRentalAccess", () =>
          c.json<RatingsContracts.RatingErrorResponse, 403>({
            error: ratingErrorMessages.UNAUTHORIZED_RENTAL_ACCESS,
            details: { code: RatingErrorCodeSchema.enum.UNAUTHORIZED_RENTAL_ACCESS },
          }, 403)),
        Match.orElse(() =>
          c.json<RatingsContracts.RatingErrorResponse, 400>({
            error: ratingErrorMessages.RENTAL_NOT_COMPLETED,
            details: { code: RatingErrorCodeSchema.enum.RENTAL_NOT_COMPLETED },
          }, 400)),
      )),
      Match.exhaustive,
    );
  });

  app.openapi(ratings.getByRental, async (c) => {
    const { rentalId } = c.req.valid("param");

    const eff = withLoggedCause(
      withRatingDeps(getRatingByRentalIdUseCase(rentalId)),
      "GET /v1/ratings/{rentalId}",
    );

    const result = await Effect.runPromise(eff);

    if (result._tag === "None") {
      return c.json<RatingsContracts.RatingErrorResponse, 404>({
        error: "Rating not found",
        details: { code: RatingErrorCodeSchema.enum.RENTAL_NOT_FOUND },
      }, 404);
    }

    return c.json<RatingsContracts.RatingResponse, 200>({
      data: mapRatingDetail(result.value),
    }, 200);
  });
}

function mapRatingDetail(row: import("@/domain/ratings").RatingRow): RatingsContracts.RatingDetail {
  return {
    id: row.id,
    rentalId: row.rentalId,
    userId: row.userId,
    rating: row.rating,
    comment: row.comment,
    reasonIds: [...row.reasonIds],
    updatedAt: row.updatedAt.toISOString(),
  };
}
