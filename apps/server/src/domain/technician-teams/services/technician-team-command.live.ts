import { Effect, Layer } from "effect";

import { StationQueryRepository } from "@/domain/stations";

import { TechnicianTeamCommandRepository } from "../repository/technician-team-command.repository";
import { TechnicianTeamQueryRepository } from "../repository/technician-team-query.repository";
import { makeTechnicianTeamCommandService } from "./technician-team-command.service";

export type { TechnicianTeamCommandService } from "./technician-team.service.types";

const makeTechnicianTeamCommandServiceEffect = Effect.gen(function* () {
  const commandRepo = yield* TechnicianTeamCommandRepository;
  const queryRepo = yield* TechnicianTeamQueryRepository;
  const stationRepo = yield* StationQueryRepository;

  return makeTechnicianTeamCommandService({
    commandRepo,
    queryRepo,
    stationRepo,
  });
});

export class TechnicianTeamCommandServiceTag extends Effect.Service<TechnicianTeamCommandServiceTag>()(
  "TechnicianTeamCommandService",
  {
    effect: makeTechnicianTeamCommandServiceEffect,
  },
) {}

export const TechnicianTeamCommandServiceLive = Layer.effect(
  TechnicianTeamCommandServiceTag,
  makeTechnicianTeamCommandServiceEffect.pipe(
    Effect.map(TechnicianTeamCommandServiceTag.make),
  ),
);
