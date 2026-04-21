import { Effect, Layer } from "effect";

import { StationQueryRepository } from "../repository/station-query.repository";
import { makeStationQueryService } from "./queries/station.query.service";

export type { StationQueryService } from "./station.service.types";

const makeStationQueryServiceEffect = Effect.gen(function* () {
  const repo = yield* StationQueryRepository;
  return makeStationQueryService(repo);
});

export class StationQueryServiceTag extends Effect.Service<StationQueryServiceTag>()(
  "StationQueryService",
  {
    effect: makeStationQueryServiceEffect,
  },
) {}

export const StationQueryServiceLive = Layer.effect(
  StationQueryServiceTag,
  makeStationQueryServiceEffect.pipe(Effect.map(StationQueryServiceTag.make)),
);
