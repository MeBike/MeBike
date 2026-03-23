import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { BikeStatus, SupplierStatus } from "generated/prisma/client";

import {
  CreateIncidentInput,
  CreateIncidentRequest,
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
import {
  IncidentSeverity,
  IncidentSource,
  IncidentStatus,
} from "generated/kysely/types";
import { IncidentRepository } from "../repository/incident.repository";
import {
  AdminRentalNotFound,
  RentalNotFound,
  RentalRepository,
} from "@/domain/rentals";
import { BikeNotFound, BikeRepository } from "@/domain/bikes";
import { StationNotFound, StationRepository } from "@/domain/stations";

export type IncidentService = {
  listIncidents: (
    filter: IncidentFilter,
    pageReq: PageRequest<IncidentSortField>,
  ) => Effect.Effect<PageResult<IncidentRow>>;

  getIncidentById: (
    incidentId: string,
  ) => Effect.Effect<IncidentRow, IncidentNotFound>;

  createIncident: (
    data: CreateIncidentRequest,
  ) => Effect.Effect<
    IncidentRow,
    | IncidentRepositoryError
    | AdminRentalNotFound
    | BikeNotFound
    | StationNotFound
  >;

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
    const rentalRepo = yield* RentalRepository;
    const bikeRepo = yield* BikeRepository;
    const stationRepo = yield* StationRepository;

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

      createIncident: (data: CreateIncidentRequest) =>
        Effect.gen(function* () {
          let finalSource: IncidentSource = IncidentSource.STAFF_INSPECTION;
          if (data.rentalId) {
            const rental = yield* rentalRepo.adminGetRentalById(data.rentalId);

            if (Option.isNone(rental)) {
              return yield* Effect.fail(new AdminRentalNotFound(data.rentalId));
            }

            if (
              rental.value.status === "RENTED" &&
              data.reporterRole === "USER"
            )
              finalSource = IncidentSource.DURING_RENTAL;
            else if (
              rental.value.status === "COMPLETED" &&
              data.reporterRole === "USER"
            )
              finalSource = IncidentSource.POST_RETURN;
          }

          let bikeLocked: boolean;
          let severity: IncidentSeverity;

          switch (finalSource) {
            case IncidentSource.DURING_RENTAL:
              bikeLocked = true;
              severity = IncidentSeverity.CRITICAL;
              break;
            case IncidentSource.POST_RETURN:
              bikeLocked = false;
              severity = IncidentSeverity.MEDIUM;
              break;
            case IncidentSource.STAFF_INSPECTION:
              bikeLocked = true;
              severity = IncidentSeverity.HIGH;
              break;
            default:
              bikeLocked = true;
              severity = IncidentSeverity.LOW;
              break;
          }

          // Check bike exists
          if (data.bikeId) {
            const bike = yield* bikeRepo.getById(data.bikeId);

            if (Option.isNone(bike)) {
              return yield* Effect.fail(new BikeNotFound({ id: data.bikeId }));
            }
          }

          // Check station exists
          if (data.stationId) {
            const station = yield* stationRepo.getById(data.stationId);

            if (Option.isNone(station)) {
              return yield* Effect.fail(
                new StationNotFound({ id: data.stationId }),
              );
            }
          }

          return yield* repo.create({
            reporterUserId: data.reporterUserId,
            rentalId: data.rentalId,
            bikeId: data.bikeId,
            stationId: data.stationId,
            source: finalSource,
            incidentType: data.incidentType,
            severity: severity,
            description: data.description,
            latitude: data.latitude,
            longitude: data.longitude,
            bikeLocked: bikeLocked,
            fileUrls: data.fileUrls,
          });
        }).pipe(
          Effect.catchTag("IncidentRepositoryError", (error) =>
            Effect.die(error),
          ),
          Effect.catchTag("RentalRepositoryError", (error) =>
            Effect.die(error),
          ),
          Effect.catchTag("StationRepositoryError", (error) =>
            Effect.die(error),
          ),
          Effect.catchTag("BikeRepositoryError", (error) => Effect.die(error)),
        ),

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
