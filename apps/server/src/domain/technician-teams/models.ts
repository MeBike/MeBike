import type { TechnicianTeamAvailability, UserRole } from "generated/prisma/client";

export const TECHNICIAN_TEAM_MEMBER_LIMIT = 3;

export type CreateTechnicianTeamInput = {
  readonly name: string;
  readonly stationId: string;
  readonly availabilityStatus?: TechnicianTeamAvailability;
};

export type UpdateTechnicianTeamInput = {
  readonly name?: string;
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

export type TechnicianTeamMemberRow = {
  readonly userId: string;
  readonly fullName: string;
  readonly role: UserRole;
};

export type TechnicianTeamDetailRow = TechnicianTeamRow & {
  readonly stationAddress: string;
  readonly members: readonly TechnicianTeamMemberRow[];
};

export type TechnicianTeamAvailableOption = {
  readonly id: string;
  readonly name: string;
  readonly stationId: string;
};
