import type { TechnicianTeamAvailability } from "generated/prisma/client";

export const TECHNICIAN_TEAM_MEMBER_LIMIT = 3;

export type CreateTechnicianTeamInput = {
  readonly name: string;
  readonly stationId: string;
  readonly availabilityStatus?: TechnicianTeamAvailability;
};

export type TechnicianTeamFilter = {
  readonly stationId?: string;
  readonly availabilityStatus?: TechnicianTeamAvailability;
};

export type TechnicianTeamRow = {
  readonly id: string;
  readonly name: string;
  readonly stationId: string;
  readonly stationName: string;
  readonly availabilityStatus: TechnicianTeamAvailability;
  readonly memberCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type TechnicianTeamAvailableOption = {
  readonly id: string;
  readonly name: string;
  readonly stationId: string;
};
