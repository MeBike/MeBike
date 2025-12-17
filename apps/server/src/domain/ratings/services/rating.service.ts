import { Context, Effect, Layer, Option } from "effect";

import type { RatingRow, CreateRatingInput } from "../models";
import { RatingRepository } from "../repository/rating.repository";
import type { RatingRepo } from "../repository/rating.repository";
import type { RatingAlreadyExists, RatingRepositoryError } from "../domain-errors";

export type RatingService = {
  create: (
    input: CreateRatingInput,
  ) => Effect.Effect<
    RatingRow,
    RatingRepositoryError | RatingAlreadyExists
  >;
  getByRentalId: (
    rentalId: string,
  ) => Effect.Effect<
    Option.Option<RatingRow>,
    RatingRepositoryError
  >;
};

export class RatingServiceTag extends Context.Tag("RatingService")<
  RatingServiceTag,
  RatingService
>() {}

export const RatingServiceLive = Layer.effect(
  RatingServiceTag,
  Effect.gen(function* () {
    const repo = yield* RatingRepository;

    const service: RatingService = {
      create: input =>
        repo.createRating(input),

      getByRentalId: rentalId =>
        repo.findByRentalId(rentalId),
    };

    return service;
  }),
);
