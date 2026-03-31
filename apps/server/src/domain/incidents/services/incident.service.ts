import { Context, Effect, Layer, Option } from "effect";

import type { BikeRepositoryError } from "@/domain/bikes";
import type { NoAvailableBike, RentalRepositoryError } from "@/domain/rentals";
import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { StationRepositoryError } from "@/domain/stations";
import type { Prisma } from "@/infrastructure/prisma";
import type { IncidentStatus, UserRole } from "generated/kysely/types";

import { BikeNotFound, BikeRepository } from "@/domain/bikes";
import { AdminRentalNotFound, RentalRepository } from "@/domain/rentals";
import { BikeNotAvailable } from "@/domain/reservations";
import { StationNotFound, StationRepository } from "@/domain/stations";
import { IncidentSeverity, IncidentSource } from "generated/kysely/types";

import type {
  IncidentRepositoryError,
  NoAvailableTechnicianFound,
  NoNearestStationFound,
} from "../domain-errors";
import type {
  CreateIncidentRequest,
  IncidentDetail,
  IncidentFilter,
  IncidentRow,
  IncidentSortField,
  TechnicianAssignmentRow,
  UpdateIncidentInput,
} from "../models";

import {
  ActiveIncidentAlreadyExists,
  IncidentNotFound,
  InvalidIncidentStatus,
  UnauthorizedIncidentAccess,
} from "../domain-errors";
import { IncidentRepository } from "../repository/incident.repository";
import { resolveIncidentUseCase } from "./resolve-incident.service";
import { startIncidentUseCase } from "./start-incident.service";

export type IncidentService = {
  listIncidents: (
    role: UserRole,
    filter: IncidentFilter,
    pageReq: PageRequest<IncidentSortField>,
  ) => Effect.Effect<PageResult<IncidentDetail>>;

  getIncidentById: (
    incidentId: string,
    userId?: string,
    role?: UserRole,
  ) => Effect.Effect<
    IncidentDetail,
    IncidentNotFound | UnauthorizedIncidentAccess
  >;

  createIncident: (
    data: CreateIncidentRequest,
  ) => Effect.Effect<
    IncidentRow,
    | IncidentRepositoryError
    | AdminRentalNotFound
    | BikeNotFound
    | StationNotFound
    | NoNearestStationFound
    | BikeNotAvailable
    | NoAvailableTechnicianFound
    | ActiveIncidentAlreadyExists
  >;

  updateIncident: (
    userId: string,
    incidentId: string,
    patch: UpdateIncidentInput,
  ) => Effect.Effect<
    IncidentDetail,
    IncidentNotFound | IncidentRepositoryError | UnauthorizedIncidentAccess
  >;

  updateIncidentStatus: (
    userId: string,
    incidentId: string,
    status: IncidentStatus,
  ) => Effect.Effect<
    IncidentDetail,
    | IncidentNotFound
    | InvalidIncidentStatus
    | IncidentRepositoryError
    | UnauthorizedIncidentAccess
  >;

  acceptIncident: (
    userId: string,
    incidentId: string,
  ) => Effect.Effect<
    TechnicianAssignmentRow,
    IncidentNotFound | IncidentRepositoryError | UnauthorizedIncidentAccess
  >;

  rejectIncident: (
    userId: string,
    incidentId: string,
  ) => Effect.Effect<
    TechnicianAssignmentRow,
    | IncidentNotFound
    | IncidentRepositoryError
    | UnauthorizedIncidentAccess
    | NoNearestStationFound
    | NoAvailableTechnicianFound
  >;

  startIncident: (
    userId: string,
    incidentId: string,
  ) => Effect.Effect<
    IncidentDetail,
    | IncidentNotFound
    | IncidentRepositoryError
    | UnauthorizedIncidentAccess
    | NoAvailableBike
    | RentalRepositoryError
    | BikeRepositoryError
    | StationRepositoryError
    | AdminRentalNotFound
    | StationNotFound
    | InvalidIncidentStatus,
    Prisma
  >;

  resolveIncident: (
    userId: string,
    incidentId: string,
  ) => Effect.Effect<
    IncidentDetail,
    | IncidentNotFound
    | IncidentRepositoryError
    | UnauthorizedIncidentAccess
    | InvalidIncidentStatus
    | BikeRepositoryError
    | RentalRepositoryError
    | AdminRentalNotFound,
    Prisma
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
      listIncidents: (role, filter, pageReq) =>
        repo.listWithOffset(role, filter, pageReq),

      getIncidentById: (incidentId, userId, role) =>
        repo.getById(incidentId).pipe(
          Effect.flatMap(opt =>
            Option.isSome(opt)
              ? Effect.succeed(opt.value)
              : Effect.fail(new IncidentNotFound({ id: incidentId })),
          ),
          Effect.flatMap((incident) => {
            if (
              role === "TECHNICIAN"
              && incident.assignments?.technician?.id !== userId
            ) {
              return Effect.fail(
                new UnauthorizedIncidentAccess({ incidentId, userId: userId! }),
              );
            }

            if (role === "USER" && incident.reporterUser.id !== userId) {
              return Effect.fail(
                new UnauthorizedIncidentAccess({ incidentId, userId: userId! }),
              );
            }
            return Effect.succeed(incident);
          }),
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
              rental.value.status === "RENTED"
              && data.reporterRole === "USER"
            ) {
              finalSource = IncidentSource.DURING_RENTAL;
            }
            else if (
              rental.value.status === "COMPLETED"
              && data.reporterRole === "USER"
            ) {
              finalSource = IncidentSource.POST_RETURN;
            }

            rental.value.bike && (data.bikeId = rental.value.bike.id);
          }

          // Check bike exists
          if (data.bikeId) {
            const bike = yield* bikeRepo.getById(data.bikeId);

            if (Option.isNone(bike)) {
              return yield* Effect.fail(new BikeNotFound({ id: data.bikeId }));
            }

            if (bike.value.status === "UNAVAILABLE") {
              return yield* Effect.fail(
                new BikeNotAvailable({
                  bikeId: data.bikeId,
                  status: "UNAVAILABLE",
                }),
              );
            }

            if (bike.value.stationId && finalSource !== "DURING_RENTAL") {
              data.stationId = bike.value.stationId;
            }
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
              bikeLocked = false;
              severity = IncidentSeverity.LOW;
              break;
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
            severity,
            description: data.description,
            latitude: data.latitude ? Number(data.latitude) : null,
            longitude: data.longitude ? Number(data.longitude) : null,
            bikeLocked,
            fileUrls: data.fileUrls,
          });
        }).pipe(
          Effect.catchTag("ActiveIncidentAlreadyExists", () =>
            Effect.fail(
              new ActiveIncidentAlreadyExists({
                bikeId: data.bikeId,
                rentalId: data.rentalId ?? undefined,
                stationId: data.stationId ?? undefined,
              }),
            )),
          Effect.catchTag("IncidentRepositoryError", error =>
            Effect.die(error)),
          Effect.catchTag("RentalRepositoryError", error =>
            Effect.die(error)),
          Effect.catchTag("StationRepositoryError", error =>
            Effect.die(error)),
          Effect.catchTag("BikeRepositoryError", error => Effect.die(error)),
        ),

      updateIncident: (
        userId: string,
        incidentId: string,
        patch: UpdateIncidentInput,
      ) =>
        Effect.gen(function* () {
          const incident = yield* repo.getById(incidentId);
          if (Option.isNone(incident)) {
            return yield* Effect.fail(new IncidentNotFound({ id: incidentId }));
          }

          if (incident.value.reporterUser.id !== userId) {
            return yield* Effect.fail(
              new UnauthorizedIncidentAccess({ incidentId, userId }),
            );
          }

          return yield* repo
            .update(incidentId, patch)
            .pipe(
              Effect.flatMap(opt =>
                Option.isSome(opt)
                  ? Effect.succeed(opt.value)
                  : Effect.fail(new IncidentNotFound({ id: incidentId })),
              ),
            );
        }),

      updateIncidentStatus: (
        userId: string,
        incidentId: string,
        status: IncidentStatus,
      ) =>
        Effect.gen(function* () {
          const incident = yield* repo.getById(incidentId);
          if (Option.isNone(incident)) {
            return yield* Effect.fail(new IncidentNotFound({ id: incidentId }));
          }

          if (
            incident.value.assignments?.technician?.id !== userId
            || incident.value.assignments?.status === "CANCELLED"
          ) {
            return yield* Effect.fail(
              new UnauthorizedIncidentAccess({ incidentId, userId }),
            );
          }

          return yield* ensureValidStatus(status).pipe(
            Effect.flatMap(() => repo.updateStatus(incidentId, status)),
            Effect.flatMap(opt =>
              Option.isSome(opt)
                ? Effect.succeed(opt.value)
                : Effect.fail(new IncidentNotFound({ id: incidentId })),
            ),
          );
        }),

      acceptIncident: (userId: string, incidentId: string) =>
        Effect.gen(function* () {
          const incident = yield* repo.getById(incidentId);
          if (Option.isNone(incident)) {
            return yield* Effect.fail(new IncidentNotFound({ id: incidentId }));
          }

          if (
            incident.value.assignments?.technician?.id !== userId
            || incident.value.assignments?.status !== "ASSIGNED"
          ) {
            return yield* Effect.fail(
              new UnauthorizedIncidentAccess({ incidentId, userId }),
            );
          }

          return yield* repo
            .acceptIncident(incidentId)
            .pipe(
              Effect.flatMap(opt =>
                Option.isSome(opt)
                  ? Effect.succeed(opt.value)
                  : Effect.fail(new IncidentNotFound({ id: incidentId })),
              ),
            );
        }),

      rejectIncident: (userId: string, incidentId: string) =>
        Effect.gen(function* () {
          const incident = yield* repo.getById(incidentId);
          if (Option.isNone(incident)) {
            return yield* Effect.fail(new IncidentNotFound({ id: incidentId }));
          }

          if (
            incident.value.assignments?.technician?.id !== userId
            || incident.value.assignments?.status === "CANCELLED"
          ) {
            return yield* Effect.fail(
              new UnauthorizedIncidentAccess({ incidentId, userId }),
            );
          }

          return yield* repo
            .rejectIncident(incidentId)
            .pipe(
              Effect.flatMap(opt =>
                Option.isSome(opt)
                  ? Effect.succeed(opt.value)
                  : Effect.fail(new IncidentNotFound({ id: incidentId })),
              ),
            );
        }),

      startIncident: (userId: string, incidentId: string) =>
        startIncidentUseCase(userId, incidentId),

      resolveIncident: (userId: string, incidentId: string) =>
        resolveIncidentUseCase(userId, incidentId),
    };
    return service;
  }),
);
