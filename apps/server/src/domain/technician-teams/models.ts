import type { TechnicianTeamAvailability } from "generated/prisma/client";

export const TECHNICIAN_TEAM_MEMBER_LIMIT = 3;

export type TechnicianTeamRow = {
  readonly id: string;
  readonly name: string;
  readonly stationId: string;
  readonly availabilityStatus: TechnicianTeamAvailability;
};

export type TechnicianTeamAvailableOption = {
  readonly id: string;
  readonly name: string;
  readonly stationId: string;
};
