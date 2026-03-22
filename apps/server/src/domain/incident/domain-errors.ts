import { Data } from "effect";

import type { WithGenericError } from "@/domain/shared";
import type { IncidentStatus } from "generated/prisma/enums";
import { IncidentSeverity, IncidentSource } from "generated/kysely/types";

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
