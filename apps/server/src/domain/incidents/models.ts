import type {
  AssignmentStatus,
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
  RentalStatus,
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
  fileUrls: string[];
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
    status: RentalStatus;
  } | null;
  bike: {
    id: string;
    bikeNumber: string;
  };
  station: {
    id: string;
    name: string;
    address: string;
  } | null;
  assignments: {
    id: string;
    status: AssignmentStatus;
    technician: {
      id: string;
      fullName: string;
    } | null;
    team: {
      id: string;
      name: string;
    } | null;
    distanceMeters: number | null;
    durationSeconds: number | null;
    routeGeometry: string | null;
    assignedAt: Date;
  } | null;
  source: IncidentSource;
  incidentType: string;
  severity: IncidentSeverity;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  fileUrls: string[];
  bikeLocked: boolean;
  status: IncidentStatus;
  reportedAt: Date;
  resolvedAt: Date | null;
  closedAt: Date | null;
};

export type IncidentFilter = {
  rentalId?: string;
  stationId?: string;
  status?: IncidentStatus;
  statuses?: IncidentStatus[];
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
  bikeId: string | null;
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
  distanceMeters: number | null;
  durationSeconds: number | null;
  routeGeometry: string | null;
};
