import {
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

export type IncidentFilter = {
  stationId?: string;
  status?: IncidentStatus;
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
  latitude: IncidentDecimal | null;
  longitude: IncidentDecimal | null;
  bikeLocked: boolean;
  fileUrls: string[];
};

export type UpdateIncidentInput = Partial<CreateIncidentInput>;
