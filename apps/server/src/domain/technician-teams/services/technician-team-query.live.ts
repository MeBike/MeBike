import { Effect, Layer } from "effect";

import { TechnicianTeamQueryRepository } from "../repository/technician-team-query.repository";
import { makeTechnicianTeamQueryService } from "./technician-team-query.service";

export type { TechnicianTeamQueryService } from "./technician-team.service.types";

const makeTechnicianTeamQueryServiceEffect = Effect.gen(function* () {
  const repo = yield* TechnicianTeamQueryRepository;
  return makeTechnicianTeamQueryService(repo);
});

export class TechnicianTeamQueryServiceTag extends Effect.Service<TechnicianTeamQueryServiceTag>()(
  "TechnicianTeamQueryService",
  {
    effect: makeTechnicianTeamQueryServiceEffect,
  },
) {}

export const TechnicianTeamQueryServiceLive = Layer.effect(
  TechnicianTeamQueryServiceTag,
  makeTechnicianTeamQueryServiceEffect.pipe(
    Effect.map(TechnicianTeamQueryServiceTag.make),
  ),
);
