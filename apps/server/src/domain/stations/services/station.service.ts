import { Effect, Layer } from "effect";

import type { AgencyRepo } from "@/domain/agencies";

import { AgencyRepository } from "@/domain/agencies";

import type { StationRepo } from "../repository/station.repository.types";
import type { StationService } from "./station.service.types";

import { StationRepository } from "../repository/station.repository";
import {
  makeStationCommandService,
} from "./station-command.service";
import { makeStationQueryService } from "./station-query.service";

export type { StationService } from "./station.service.types";

export function makeStationService(
  repo: StationRepo,
  deps: {
    agencyRepo: Pick<AgencyRepo, "getById">;
    reservationRepo?: unknown;
  },
): StationService {
  return {
    ...makeStationQueryService(repo),
    ...makeStationCommandService({
      agencyRepo: deps.agencyRepo,
      commandRepo: repo,
      queryRepo: repo,
    }),
  };
}

const makeStationServiceEffect = Effect.gen(function* () {
  const agencyRepo = yield* AgencyRepository;
  const repo = yield* StationRepository;

  return makeStationService(repo, { agencyRepo });
});

export class StationServiceTag extends Effect.Service<StationServiceTag>()(
  "StationService",
  {
    effect: makeStationServiceEffect,
  },
) {}

export const StationServiceLive = Layer.effect(
  StationServiceTag,
  makeStationServiceEffect.pipe(Effect.map(StationServiceTag.make)),
);
