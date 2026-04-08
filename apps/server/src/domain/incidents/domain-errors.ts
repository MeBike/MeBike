import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";
import type { IncidentSeverity, IncidentSource } from "generated/kysely/types";
import type { IncidentStatus } from "generated/prisma/enums";

export class IncidentRepositoryError extends Data.TaggedError(
  "IncidentRepositoryError",
)<WithGenericError> {}
/**
 * Incident not found by ID
 * Use case: GET/PUT/PATCH /incidents/:id
 * Backend message: INCIDENT_NOT_FOUND
 */
export class IncidentNotFound extends Data.TaggedError("IncidentNotFound")<{
  readonly id: string;
}> {}

/**
 * Invalid status value (not in IncidentStatus enum)
 * Use case: PATCH /incidents/:id (change status)
 * Backend message: STATUS_INVALID
 */
export class InvalidIncidentStatus extends Data.TaggedError(
  "InvalidIncidentStatus",
)<{
    readonly status: string;
    readonly allowed: readonly IncidentStatus[];
  }> {}

export class InvalidIncidentSeverity extends Data.TaggedError(
  "InvalidIncidentSeverity",
)<{
    readonly severity: string;
    readonly allowed: readonly IncidentSeverity[];
  }> {}

export class InvalidIncidentSource extends Data.TaggedError(
  "InvalidIncidentSource",
)<{
    readonly source: string;
    readonly allowed: readonly IncidentSource[];
  }> {}

export class NoNearestStationFound extends Data.TaggedError(
  "NoNearestStationFound",
)<{
    readonly latitude: number;
    readonly longitude: number;
  }> {}

export class NoAvailableTechnicianFound extends Data.TaggedError(
  "NoAvailableTechnicianFound",
)<{
    readonly latitude: number;
    readonly longitude: number;
  }> {}

export class UnauthorizedIncidentAccess extends Data.TaggedError(
  "UnauthorizedIncidentAccess",
)<{
    readonly incidentId: string;
    readonly userId: string;
  }> {}

export class IncidentInternalStationRequired extends Data.TaggedError(
  "IncidentInternalStationRequired",
)<{
    readonly stationId: string;
    readonly stationType: string;
  }> {}

export class ActiveIncidentAlreadyExists extends Data.TaggedError(
  "ActiveIncidentAlreadyExists",
)<{
    readonly bikeId?: string;
    readonly rentalId?: string;
    readonly stationId?: string;
  }> {}
