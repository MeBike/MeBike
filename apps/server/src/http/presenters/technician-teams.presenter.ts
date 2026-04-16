import type { TechnicianTeamsContracts } from "@mebike/shared";

import type {
  TechnicianTeamAvailableOption,
  TechnicianTeamRow,
} from "@/domain/technician-teams";

export function toContractTechnicianTeamSummary(
  team: TechnicianTeamRow,
): TechnicianTeamsContracts.TechnicianTeamSummary {
  return {
    id: team.id,
    name: team.name,
    station: {
      id: team.stationId,
      name: team.stationName,
    },
    availabilityStatus: team.availabilityStatus,
    memberCount: team.memberCount,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
  };
}

export function toContractAvailableTechnicianTeam(
  team: TechnicianTeamAvailableOption,
): TechnicianTeamsContracts.TechnicianTeamAvailableOption {
  return {
    id: team.id,
    name: team.name,
    stationId: team.stationId,
  };
}
