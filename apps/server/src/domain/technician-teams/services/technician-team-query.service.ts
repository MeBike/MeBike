import type { TechnicianTeamQueryRepo } from "../repository/technician-team.repository.types";
import type { TechnicianTeamQueryService } from "./technician-team.service.types";

export function makeTechnicianTeamQueryService(
  repo: TechnicianTeamQueryRepo,
): TechnicianTeamQueryService {
  return {
    listTechnicianTeams: filter => repo.list(filter),
    listAvailableTechnicianTeams: args => repo.listAvailable(args),
  };
}
