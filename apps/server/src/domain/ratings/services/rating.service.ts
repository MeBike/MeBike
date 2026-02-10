import type { Option } from "effect";

import { Context, Effect, Layer } from "effect";

import type { RatingAlreadyExists, RatingRepositoryError } from "../domain-errors";
import type { CreateRatingInput, RatingRow } from "../models";

import { RatingRepository } from "../repository/rating.repository";

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
