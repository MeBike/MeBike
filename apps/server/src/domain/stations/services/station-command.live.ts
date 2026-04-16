import { Effect, Layer } from "effect";

import { AgencyRepository } from "@/domain/agencies";

import { StationCommandRepository } from "../repository/station-command.repository";
import { StationQueryRepository } from "../repository/station-query.repository";
import { makeStationCommandService } from "./station-command.service";

export type { StationCommandService } from "./station.service.types";

const makeStationCommandServiceEffect = Effect.gen(function* () {
  const agencyRepo = yield* AgencyRepository;
  const commandRepo = yield* StationCommandRepository;
  const queryRepo = yield* StationQueryRepository;

  return makeStationCommandService({
    agencyRepo,
    commandRepo,
    queryRepo,
  });
});

export class StationCommandServiceTag extends Effect.Service<StationCommandServiceTag>()(
  "StationCommandService",
  {
    effect: makeStationCommandServiceEffect,
  },
) {}

export const StationCommandServiceLive = Layer.effect(
  StationCommandServiceTag,
  makeStationCommandServiceEffect.pipe(Effect.map(StationCommandServiceTag.make)),
);
