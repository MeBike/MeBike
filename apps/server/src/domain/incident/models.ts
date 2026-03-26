import type {
  AssignmentStatus,
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
} from "generated/kysely/types";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

export type IncidentDecimal = PrismaTypes.Decimal;

export type IncidentRow = {
  id: string;
  reporterUserId: string;
  rentalId: string | null;
  bikeId: string;
  stationId: string | null;
  source: IncidentSource;
  incidentType: string;
  severity: IncidentSeverity;
  description: string | null;
  latitude: IncidentDecimal | null;
  longitude: IncidentDecimal | null;
  bikeLocked: boolean;
  status: IncidentStatus;
  reportedAt: Date;
  resolvedAt: Date | null;
  closedAt: Date | null;
};

export type IncidentDetail = {
  id: string;
  reporterUser: {
    id: string;
    fullName: string;
    phoneNumber: string | null;
  };
  rental: {
    id: string;
    status: string;
  } | null;
  bike: {
    id: string;
    chipId: string;
  };
  station: {
    id: string;
    name: string;
    address: string;
  } | null;
  assignments: {
    id: string;
    status: string;
    technician: {
      id: string;
      fullName: string;
    } | null;
    team: {
      id: string;
      name: string;
    } | null;
    assignedAt: Date;
  } | null;
  source: IncidentSource;
  incidentType: string;
  severity: IncidentSeverity;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  bikeLocked: boolean;
  status: IncidentStatus;
  reportedAt: Date;
  resolvedAt: Date | null;
  closedAt: Date | null;
};

export type IncidentFilter = {
  stationId?: string;
  status?: IncidentStatus;
  userId?: string;
};

export type IncidentSortField = "status" | "resolvedAt";

export type CreateIncidentInput = {
  reporterUserId: string;
  rentalId: string | null;
  bikeId: string;
  stationId: string | null;
  source: IncidentSource;
  incidentType: string;
  severity: IncidentSeverity;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  bikeLocked: boolean;
  fileUrls: string[];
};

export type CreateIncidentRequest = {
  reporterUserId: string;
  reporterRole: string;
  rentalId: string | null;
  bikeId: string;
  stationId: string | null;
  incidentType: string;
  description: string | null;
  latitude: IncidentDecimal | null;
  longitude: IncidentDecimal | null;
  fileUrls: string[];
};

export type UpdateIncidentInput = Omit<
  Partial<CreateIncidentInput>,
  "bikeId" | "rentalId" | "stationId"
>;

export type TechnicianAssignmentRow = {
  id: string;
  incidentReportId: string;
  technicianTeamId: string | null;
  technicianUserId: string | null;
  assignedByUserId: string | null;
  assignedAt: Date;
  acceptedAt: Date | null;
  startedAt: Date | null;
  resolvedAt: Date | null;
  status: AssignmentStatus;
};
