import type { IncidentSeverity, IncidentSource, IncidentStatus } from "generated/kysely/types";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

export const incidentDetailSelect = {
  id: true,
  reporterUser: {
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
    },
  },
  rental: {
    select: {
      id: true,
      status: true,
    },
  },
  bike: {
    select: {
      id: true,
      bikeNumber: true,
    },
  },
  station: {
    select: {
      id: true,
      name: true,
      address: true,
    },
  },
  assignments: {
    select: {
      id: true,
      status: true,
      technicianUser: {
        select: {
          id: true,
          fullName: true,
        },
      },
      technicianTeam: {
        select: {
          id: true,
          name: true,
        },
      },
      distanceMeters: true,
      durationSeconds: true,
      routeGeometry: true,
      assignedAt: true,
    },
    orderBy: {
      assignedAt: "desc",
    },
    take: 1,
  },
  source: true,
  incidentType: true,
  severity: true,
  description: true,
  latitude: true,
  longitude: true,
  attachments: {
    select: {
      fileUrl: true,
    },
  },
  bikeLocked: true,
  status: true,
  reportedAt: true,
  resolvedAt: true,
  closedAt: true,
} as const;

export const technicianAssignmentDetailSelect = {
  id: true,
  incidentReportId: true,
  technicianTeamId: true,
  technicianUserId: true,
  assignedByUserId: true,
  assignedAt: true,
  acceptedAt: true,
  startedAt: true,
  resolvedAt: true,
  status: true,
  distanceMeters: true,
  durationSeconds: true,
  routeGeometry: true,
} as const;

type IncidentDetailSelect = PrismaTypes.IncidentReportGetPayload<{
  select: typeof incidentDetailSelect;
}>;

export function mapToIncidentDetail(raw: IncidentDetailSelect) {
  const latestAssignment = raw.assignments?.[0];

  return {
    id: raw.id,
    reporterUser: raw.reporterUser,
    rental: raw.rental,
    bike: raw.bike,
    station: raw.station,
    assignments: latestAssignment
      ? {
          id: latestAssignment.id,
          status: latestAssignment.status,
          technician: latestAssignment.technicianUser,
          team: latestAssignment.technicianTeam,
          distanceMeters: latestAssignment.distanceMeters,
          durationSeconds: latestAssignment.durationSeconds,
          routeGeometry: latestAssignment.routeGeometry,
          assignedAt: latestAssignment.assignedAt,
        }
      : null,
    source: raw.source as IncidentSource,
    incidentType: raw.incidentType,
    severity: raw.severity as IncidentSeverity,
    description: raw.description,
    latitude: raw.latitude ? Number(raw.latitude) : null,
    longitude: raw.longitude ? Number(raw.longitude) : null,
    fileUrls: raw.attachments.map(attachment => attachment.fileUrl),
    bikeLocked: raw.bikeLocked,
    status: raw.status as IncidentStatus,
    reportedAt: raw.reportedAt,
    resolvedAt: raw.resolvedAt,
    closedAt: raw.closedAt,
  };
}
