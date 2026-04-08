import { Effect, Layer, Option } from "effect";

import type { BikeStatus, BikeSwapStatus } from "generated/kysely/types";
import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import type { RentalRepo } from "./rental.repository.types";

import {
  BikeSwapRequestExisted,
  BikeSwapRequestNotFound,
  InvalidBikeSwapRequestStatus,
  NoAvailableBike,
  RentalRepositoryError,
} from "../domain-errors";
import { makeRentalReadRepository } from "./read/rental.read.repository";
import {
  bikeSwapRequestSelect,
  mapToBikeSwapRequestRow,
  mapToStaffBikeSwapRequestRow,
  staffBikeSwapRequestSelect,
  toMyBikeSwapRequestsWhere,
  toStaffBikeSwapRequestsOrderBy,
  toStaffBikeSwapRequestsWhere,
} from "./rental.repository.query";
import { makeRentalWriteRepository } from "./write/rental.write.repository";

export type {
  CreateRentalInput,
  RentalRepo,
  UpdateRentalOnEndInput,
} from "./rental.repository.types";

export function makeRentalRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): RentalRepo {
  const resolveOperatorStationId = (
    tx: PrismaClient | PrismaTypes.TransactionClient,
    userId: string,
  ) =>
    Effect.gen(function* () {
      const operator = yield* Effect.tryPromise({
        try: () =>
          tx.user.findUnique({
            where: { id: userId },
            select: {
              role: true,
              orgAssignment: {
                select: {
                  stationId: true,
                  agencyId: true,
                },
              },
            },
          }),
        catch: e =>
          new RentalRepositoryError({
            operation: "resolveOperatorStationId.findUser",
            cause: e,
          }),
      });

      if (!operator) {
        return Option.none<string>();
      }

      if (operator.role === "STAFF" || operator.role === "MANAGER") {
        return Option.fromNullable(operator.orgAssignment?.stationId ?? null);
      }

      if (operator.role === "AGENCY" && operator.orgAssignment?.agencyId) {
        const station = yield* Effect.tryPromise({
          try: () =>
            tx.station.findUnique({
              where: { agencyId: operator.orgAssignment!.agencyId! },
              select: { id: true },
            }),
          catch: e =>
            new RentalRepositoryError({
              operation: "resolveOperatorStationId.findAgencyStation",
              cause: e,
            }),
        });

        return Option.fromNullable(station?.id ?? null);
      }

      return Option.none<string>();
    });

  const approveBikeSwapRequestWithClient = (
    tx: PrismaClient | PrismaTypes.TransactionClient,
    userId: string,
    bikeSwapRequestId: string,
  ) =>
    Effect.gen(function* () {
      const station = yield* resolveOperatorStationId(tx, userId);
      if (Option.isNone(station)) {
        return Option.none();
      }

      const bikeSwapRequest = yield* Effect.tryPromise({
        try: () =>
          tx.bikeSwapRequest.findUnique({
            where: { id: bikeSwapRequestId, stationId: station.value },
            select: { status: true, oldBikeId: true, stationId: true },
          }),
        catch: e =>
          new RentalRepositoryError({
            operation: "approveBikeSwapRequest.findBikeSwapRequest",
            cause: e,
          }),
      });

      if (!bikeSwapRequest) {
        return yield* Effect.fail(
          new BikeSwapRequestNotFound({ bikeSwapRequestId }),
        );
      }

      if (bikeSwapRequest.status !== "PENDING") {
        return yield* Effect.fail(
          new InvalidBikeSwapRequestStatus({
            status: bikeSwapRequest.status,
          }),
        );
      }

      const bike = yield* Effect.tryPromise({
        try: () =>
          tx.bike.findFirst({
            where: {
              status: "AVAILABLE",
              stationId: bikeSwapRequest.stationId,
            },
            select: { id: true },
          }),
        catch: e =>
          new RentalRepositoryError({
            operation: "approveBikeSwapRequest.findBike",
            cause: e,
          }),
      });

      if (!bike) {
        return yield* Effect.fail(new NoAvailableBike({}));
      }

      yield* Effect.tryPromise({
        try: () =>
          tx.bike.update({
            where: { id: bike.id },
            data: {
              status: "BOOKED" as BikeStatus,
            },
          }),
        catch: e =>
          new RentalRepositoryError({
            operation: "approveBikeSwapRequest.updateBike",
            cause: e,
          }),
      });

      yield* Effect.tryPromise({
        try: () =>
          tx.bike.update({
            where: { id: bikeSwapRequest.oldBikeId },
            data: {
              status: "BROKEN" as BikeStatus,
            },
          }),
        catch: e =>
          new RentalRepositoryError({
            operation: "approveBikeSwapRequest.updateOldBike",
            cause: e,
          }),
      });

      const updatedBikeSwapRequest = yield* Effect.tryPromise({
        try: () =>
          tx.bikeSwapRequest.update({
            where: { id: bikeSwapRequestId },
            data: {
              status: "CONFIRMED" as BikeSwapStatus,
              newBikeId: bike.id,
            },
            select: staffBikeSwapRequestSelect,
          }),
        catch: e =>
          new RentalRepositoryError({
            operation: "approveBikeSwapRequest.updateRequest",
            cause: e,
          }),
      });

      yield* Effect.tryPromise({
        try: () =>
          tx.rental.update({
            where: { id: updatedBikeSwapRequest.rentalId },
            data: {
              bikeId: bike.id,
            },
          }),
        catch: e =>
          new RentalRepositoryError({
            operation: "approveBikeSwapRequest.updateRental",
            cause: e,
          }),
      });

      return Option.some(mapToStaffBikeSwapRequestRow(updatedBikeSwapRequest));
    });

  return {
    ...makeRentalReadRepository(db),
    ...makeRentalWriteRepository(db),

    requestBikeSwap(rentalId, userId, oldBikeId, stationId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            db.bikeSwapRequest.create({
              data: {
                rentalId,
                userId,
                oldBikeId,
                stationId,
                status: "PENDING" as BikeSwapStatus,
              },
              select: bikeSwapRequestSelect,
            }),
          catch: (e) => {
            if (isPrismaUniqueViolation(e)) {
              return new BikeSwapRequestExisted({ rentalId });
            }

            return new RentalRepositoryError({
              operation: "requestBikeSwap.create",
              cause: e,
            });
          },
        });

        return mapToBikeSwapRequestRow(raw);
      });
    },

    staffListBikeSwapRequests(staffUserId, filter, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);
        const orderBy = toStaffBikeSwapRequestsOrderBy(pageReq);

        const station = yield* resolveOperatorStationId(db, staffUserId);
        if (Option.isNone(station)) {
          return makePageResult([], 0, page, pageSize);
        }

        const filterWithStationScope = {
          ...filter,
          stationId: station.value,
        };
        const where = toStaffBikeSwapRequestsWhere(filterWithStationScope);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => db.bikeSwapRequest.count({ where }),
            catch: e =>
              new RentalRepositoryError({
                operation: "staffListBikeSwapRequests.count",
                cause: e,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              db.bikeSwapRequest.findMany({
                where,
                skip,
                take,
                orderBy,
                select: staffBikeSwapRequestSelect,
              }),
            catch: e =>
              new RentalRepositoryError({
                operation: "staffListBikeSwapRequests.findMany",
                cause: e,
              }),
          }),
        ]);

        return makePageResult(
          items.map(mapToStaffBikeSwapRequestRow),
          total,
          page,
          pageSize,
        );
      });
    },

    staffGetBikeSwapRequests(staffUserId, bikeSwapRequestId) {
      return Effect.gen(function* () {
        const station = yield* resolveOperatorStationId(db, staffUserId);
        if (Option.isNone(station)) {
          return Option.none();
        }

        const raw = yield* Effect.tryPromise({
          try: () =>
            db.bikeSwapRequest.findUnique({
              where: { id: bikeSwapRequestId, stationId: station.value },
              select: staffBikeSwapRequestSelect,
            }),
          catch: e =>
            new RentalRepositoryError({
              operation: "staffGetBikeSwapRequests",
              cause: e,
            }),
        });

        if (!raw) {
          return Option.none();
        }
        return Option.some(mapToStaffBikeSwapRequestRow(raw));
      });
    },

    adminListBikeSwapRequests(filter, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);
        const orderBy = toStaffBikeSwapRequestsOrderBy(pageReq);
        const where = toStaffBikeSwapRequestsWhere(filter);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => db.bikeSwapRequest.count({ where }),
            catch: e =>
              new RentalRepositoryError({
                operation: "adminListBikeSwapRequests.count",
                cause: e,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              db.bikeSwapRequest.findMany({
                where,
                skip,
                take,
                orderBy,
                select: staffBikeSwapRequestSelect,
              }),
            catch: e =>
              new RentalRepositoryError({
                operation: "adminListBikeSwapRequests.findMany",
                cause: e,
              }),
          }),
        ]);

        return makePageResult(
          items.map(mapToStaffBikeSwapRequestRow),
          total,
          page,
          pageSize,
        );
      });
    },

    staffApproveBikeSwapRequests(staffUserId: string, bikeSwapRequestId: string) {
      return approveBikeSwapRequestWithClient(db, staffUserId, bikeSwapRequestId);
    },

    staffRejectBikeSwapRequests(
      staffUserId: string,
      bikeSwapRequestId: string,
      reason: string,
    ) {
      return Effect.gen(function* () {
        const stationId = yield* resolveOperatorStationId(db, staffUserId);
        if (Option.isNone(stationId)) {
          return Option.none();
        }

        const current = yield* Effect.tryPromise({
          try: () =>
            db.bikeSwapRequest.findUnique({
              where: { id: bikeSwapRequestId, stationId: stationId.value },
              select: { status: true },
            }),
          catch: e =>
            new RentalRepositoryError({
              operation: "staffRejectBikeSwapRequests.find",
              cause: e,
            }),
        });

        if (!current) {
          return Option.none();
        }

        if (current.status !== "PENDING") {
          return yield* Effect.fail(
            new InvalidBikeSwapRequestStatus({
              status: current.status,
            }),
          );
        }

        const raw = yield* Effect.tryPromise({
          try: () =>
            db.bikeSwapRequest.update({
              where: { id: bikeSwapRequestId },
              data: {
                status: "REJECTED" as BikeSwapStatus,
                reason,
              },
              select: staffBikeSwapRequestSelect,
            }),
          catch: e =>
            new RentalRepositoryError({
              operation: "staffRejectBikeSwapRequests.update",
              cause: e,
            }),
        });

        return Option.some(mapToStaffBikeSwapRequestRow(raw as any));
      });
    },

    getMyBikeSwapRequests(filter, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);
        const orderBy = toStaffBikeSwapRequestsOrderBy(pageReq);
        const where = toMyBikeSwapRequestsWhere(filter);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => db.bikeSwapRequest.count({ where }),
            catch: e =>
              new RentalRepositoryError({
                operation: "getMyBikeSwapRequests.count",
                cause: e,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              db.bikeSwapRequest.findMany({
                where,
                skip,
                take,
                orderBy,
                select: staffBikeSwapRequestSelect,
              }),
            catch: e =>
              new RentalRepositoryError({
                operation: "getMyBikeSwapRequests.findMany",
                cause: e,
              }),
          }),
        ]);

        return makePageResult(
          items.map(mapToStaffBikeSwapRequestRow),
          total,
          page,
          pageSize,
        );
      });
    },

    getMyBikeSwapRequest(userId, bikeSwapRequestId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            db.bikeSwapRequest.findUnique({
              where: { id: bikeSwapRequestId, userId },
              select: staffBikeSwapRequestSelect,
            }),
          catch: e =>
            new RentalRepositoryError({
              operation: "getMyBikeSwapRequest.find",
              cause: e,
            }),
        });

        if (!raw) {
          return yield* Effect.fail(
            new BikeSwapRequestNotFound({ bikeSwapRequestId }),
          );
        }
        return mapToStaffBikeSwapRequestRow(raw);
      });
    },

    adminGetBikeSwapRequest(bikeSwapRequestId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            db.bikeSwapRequest.findUnique({
              where: { id: bikeSwapRequestId },
              select: staffBikeSwapRequestSelect,
            }),
          catch: e =>
            new RentalRepositoryError({
              operation: "adminGetBikeSwapRequest.find",
              cause: e,
            }),
        });

        if (!raw) {
          return Option.none();
        }
        return Option.some(mapToStaffBikeSwapRequestRow(raw));
      });
    },
  };
}

const makeRentalRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeRentalRepository(client);
});

export class RentalRepository extends Effect.Service<RentalRepository>()(
  "RentalRepository",
  {
    effect: makeRentalRepositoryEffect,
  },
) {}

export const RentalRepositoryLive = Layer.effect(
  RentalRepository,
  makeRentalRepositoryEffect.pipe(Effect.map(RentalRepository.make)),
);
