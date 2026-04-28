import type { TechnicianTeamsContracts } from "@mebike/shared";

import type {
  TechnicianTeamAvailableOption,
  TechnicianTeamDetailRow,
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

export function toContractTechnicianTeamDetail(
  team: TechnicianTeamDetailRow,
): TechnicianTeamsContracts.TechnicianTeamDetail {
  return {
    ...toContractTechnicianTeamSummary(team),
    station: {
      id: team.stationId,
      name: team.stationName,
      address: team.stationAddress,
    },
    members: team.members.map(member => ({
      userId: member.userId,
      fullName: member.fullName,
      role: member.role,
    })),
  };
}
