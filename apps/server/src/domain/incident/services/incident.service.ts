import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { BikeStatus, SupplierStatus } from "generated/prisma/client";

import type {
  CreateIncidentInput,
  IncidentFilter,
  IncidentRow,
  IncidentSortField,
  UpdateIncidentInput,
} from "../models";
import { SupplierRepository, SupplierService } from "@/domain/suppliers";
import {
  IncidentNotFound,
  IncidentRepositoryError,
  InvalidIncidentStatus,
} from "../domain-errors";
import { IncidentStatus } from "generated/kysely/types";
import { IncidentRepository } from "../repository/incident.repository";

export type IncidentService = {
  listIncidents: (
    filter: IncidentFilter,
    pageReq: PageRequest<IncidentSortField>,
  ) => Effect.Effect<PageResult<IncidentRow>>;

  getIncidentById: (
    incidentId: string,
  ) => Effect.Effect<IncidentRow, IncidentNotFound>;

  createIncident: (
    data: CreateIncidentInput,
  ) => Effect.Effect<IncidentRow, IncidentRepositoryError>;

  updateIncident: (
    incidentId: string,
    patch: UpdateIncidentInput,
  ) => Effect.Effect<IncidentRow, IncidentNotFound | IncidentRepositoryError>;

  updateIncidentStatus: (
    incidentId: string,
    status: IncidentStatus,
  ) => Effect.Effect<
    IncidentRow,
    IncidentNotFound | InvalidIncidentStatus | IncidentRepositoryError
  >;
};

export class IncidentServiceTag extends Context.Tag("IncidentService")<
  IncidentServiceTag,
  IncidentService
>() {}

const allowedStatuses: readonly IncidentStatus[] = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
];

export function ensureValidStatus(
  status: IncidentStatus | undefined,
): Effect.Effect<void, InvalidIncidentStatus, never> {
  if (status === undefined) {
    return Effect.void;
  }
  return allowedStatuses.includes(status)
    ? Effect.void
    : Effect.fail(
        new InvalidIncidentStatus({ status, allowed: allowedStatuses }),
      );
}

export const IncidentServiceLive = Layer.effect(
  IncidentServiceTag,
  Effect.gen(function* () {
    const repo = yield* IncidentRepository;

    const service: IncidentService = {
      listIncidents: (filter, pageReq) => repo.listWithOffset(filter, pageReq),

      getIncidentById: (incidentId: string) =>
        repo
          .getById(incidentId)
          .pipe(
            Effect.flatMap((opt) =>
              Option.isSome(opt)
                ? Effect.succeed(opt.value)
                : Effect.fail(new IncidentNotFound({ id: incidentId })),
            ),
          ),

      createIncident: (data: CreateIncidentInput) => repo.create(data),

      updateIncident: (incidentId: string, patch: UpdateIncidentInput) =>
        repo
          .update(incidentId, patch)
          .pipe(
            Effect.flatMap((opt) =>
              Option.isSome(opt)
                ? Effect.succeed(opt.value)
                : Effect.fail(new IncidentNotFound({ id: incidentId })),
            ),
          ),

      updateIncidentStatus: (incidentId: string, status: IncidentStatus) =>
        ensureValidStatus(status).pipe(
          Effect.flatMap(() => repo.updateStatus(incidentId, status)),
          Effect.flatMap((opt) =>
            Option.isSome(opt)
              ? Effect.succeed(opt.value)
              : Effect.fail(new IncidentNotFound({ id: incidentId })),
          ),
        ),
    };

    return service;
  }),
);
