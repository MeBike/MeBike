import { Effect, Layer } from "effect";

import { BikeRepository } from "../../repository/bike.repository";
import { makeBikeQueryService } from "./bike-query.service";

export type { BikeQueryService } from "./bike-query.service.types";

const makeBikeQueryServiceEffect = Effect.gen(function* () {
  const repo = yield* BikeRepository;
  return makeBikeQueryService(repo);
});

export class BikeQueryServiceTag extends Effect.Service<BikeQueryServiceTag>()(
  "BikeQueryService",
  {
    effect: makeBikeQueryServiceEffect,
  },
) {}

export const BikeQueryServiceLive = Layer.effect(
  BikeQueryServiceTag,
  makeBikeQueryServiceEffect.pipe(Effect.map(BikeQueryServiceTag.make)),
);
