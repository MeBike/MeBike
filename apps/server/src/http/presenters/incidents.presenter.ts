import type { IncidentsContracts } from "@mebike/shared";

import type { IncidentRow } from "@/domain/incidents";

export function toIncidentSummary(
  row: IncidentRow,
): IncidentsContracts.IncidentSummary {
  return {
    id: row.id,
    reporterUserId: row.reporterUserId,
    rentalId: row.rentalId,
    bikeId: row.bikeId,
    stationId: row.stationId,
    source: row.source,
    incidentType: row.incidentType,
    severity: row.severity,
    description: row.description,
    latitude: row.latitude ? Number(row.latitude) : null,
    longitude: row.longitude ? Number(row.longitude) : null,
    bikeLocked: row.bikeLocked,
    status: row.status,
    reportedAt: row.reportedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    closedAt: row.closedAt?.toISOString() ?? null,
  };
}
