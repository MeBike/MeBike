import { Effect, Option } from "effect";

import type { TechnicianTeamQueryRepo } from "../repository/technician-team.repository.types";
import type { TechnicianTeamQueryService } from "./technician-team.service.types";

import { TechnicianTeamNotFound } from "../domain-errors";

export function makeTechnicianTeamQueryService(
  repo: TechnicianTeamQueryRepo,
): TechnicianTeamQueryService {
  return {
    getTechnicianTeamDetail: id =>
      repo.getDetailById(id).pipe(
        Effect.flatMap(Option.match({
          onNone: () => Effect.fail(new TechnicianTeamNotFound({ id })),
          onSome: Effect.succeed,
        })),
      ),
    listTechnicianTeams: (filter, pageReq) => repo.list(filter, pageReq),
    listAvailableTechnicianTeams: args => repo.listAvailable(args),
  };
}
