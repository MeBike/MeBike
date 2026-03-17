import { Effect, Layer, Match, Option } from "effect";

import type { BikeStatus, BikeSwapStatus } from "generated/kysely/types";
import type {
  PrismaClient,
  Prisma as PrismaTypes,
  RentalStatus,
} from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";
import {
  getPrismaUniqueViolationTarget,
  isPrismaUniqueViolation,
} from "@/infrastructure/prisma-errors";
import { uniqueTargets } from "@/infrastructure/prisma-unique-violation";

import type { AdminRentalListItem, StaffBikeSwapRequestRow } from "../models";
import type { CreateRentalInput, RentalRepo } from "./rental.repository.types";

import {
  BikeSwapRequestNotFound,
  BikeSwapRequestExisted,
  InvalidBikeSwapRequestStatus,
  NoAvailableBike,
  RentalRepositoryError,
  RentalUniqueViolation,
} from "../domain-errors";

import {
  adminRentalDetailSelect,
  adminRentalListSelect,
  mapToAdminRentalDetail,
  mapToAdminRentalListItem,
} from "./rental.repository.admin.query";
import {
  bikeSwapRequestSelect,
  mapToBikeSwapRequestRow,
  mapToRentalRow,
  mapToStaffBikeSwapRequestRow,
  rentalSelect,
  staffBikeSwapRequestSelect,
  toAdminRentalsWhere,
  toMyRentalsWhere,
  toRentalOrderBy,
  toStaffBikeSwapRequestsOrderBy,
  toStaffBikeSwapRequestsWhere,
} from "./rental.repository.query";

export type {
  CreateRentalInput,
  CreateReservedRentalInput,
  RentalRepo,
  UpdateRentalOnEndInput,
} from "./rental.repository.types";

export function makeRentalRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): RentalRepo {
  const client = db;
  const select = rentalSelect;

  const createRentalWithClient = (
    tx: PrismaClient | PrismaTypes.TransactionClient,
    data: CreateRentalInput,
  ) =>
    Effect.tryPromise({
      try: () =>
        tx.rental.create({
          data: {
            userId: data.userId,
            bikeId: data.bikeId,
            startStationId: data.startStationId,
            startTime: data.startTime,
            subscriptionId: data.subscriptionId ?? null,
            status: "RENTED" as RentalStatus,
          },
          select,
        }),
      catch: (error) =>
        Match.value(error).pipe(
          Match.when(
            isPrismaUniqueViolation,
            (e) =>
              new RentalUniqueViolation({
                operation: "createRental",
                constraint: uniqueTargets(e),
                cause: e,
              }),
          ),
          Match.orElse(
            (e) =>
              new RentalRepositoryError({
                operation: "createRental",
                cause: e,
              }),
          ),
        ),
    }).pipe(Effect.map(mapToRentalRow));

  const approveBikeSwapRequestWithClient = (
    tx: PrismaClient | PrismaTypes.TransactionClient,
    bikeSwapRequestId: string,
  ) =>
    Effect.gen(function* () {
      const bikeSwapRequest = yield* Effect.tryPromise({
        try: () =>
          tx.bikeSwapRequest.findUnique({
            where: { id: bikeSwapRequestId },
            select: { status: true, oldBikeId: true, stationId: true },
          }),
        catch: (e) =>
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
        catch: (e) =>
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
        catch: (e) =>
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
        catch: (e) =>
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
        catch: (e) =>
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
        catch: (e) =>
          new RentalRepositoryError({
            operation: "approveBikeSwapRequest.updateRental",
            cause: e,
          }),
      });

      return Option.some(mapToStaffBikeSwapRequestRow(updatedBikeSwapRequest));
    });

  return {
    listMyRentals(userId, filter, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where = toMyRentalsWhere(userId, filter);
        const orderBy = toRentalOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.rental.count({ where }),
            catch: (e) =>
              new RentalRepositoryError({
                operation: "listMyRentals.count",
                cause: e,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.rental.findMany({
                where,
                skip,
                take,
                orderBy,
                select,
              }),
            catch: (e) =>
              new RentalRepositoryError({
                operation: "listMyRentals.findMany",
                cause: e,
              }),
          }),
        ]);

        const mappedItems = items.map(mapToRentalRow);

        return makePageResult(mappedItems, total, page, pageSize);
      });
    },

    listMyCurrentRentals(userId, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where = toMyRentalsWhere(userId, { status: "RENTED" });
        const orderBy = toRentalOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.rental.count({ where }),
            catch: (e) =>
              new RentalRepositoryError({
                operation: "listMyCurrentRentals.count",
                cause: e,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.rental.findMany({
                where,
                skip,
                take,
                orderBy,
                select,
              }),
            catch: (e) =>
              new RentalRepositoryError({
                operation: "listMyCurrentRentals.findMany",
                cause: e,
              }),
          }),
        ]);

        const mappedItems = items.map(mapToRentalRow);

        return makePageResult(mappedItems, total, page, pageSize);
      });
    },

    getMyRentalById(userId, rentalId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.rental.findFirst({
              where: { id: rentalId, userId },
              select,
            }),
          catch: (e) =>
            new RentalRepositoryError({
              operation: "getMyRentalById",
              cause: e,
            }),
        });

        return Option.fromNullable(raw).pipe(Option.map(mapToRentalRow));
      });
    },

    getMyRentalCounts(userId) {
      return Effect.tryPromise({
        try: async () => {
          const rows = await client.rental.groupBy({
            by: ["status"],
            _count: { _all: true },
            where: { userId },
          });
          return rows.map((row) => ({
            status: row.status,
            count: row._count._all,
          }));
        },
        catch: (e) =>
          new RentalRepositoryError({
            operation: "getMyRentalCounts",
            cause: e,
          }),
      });
    },

    findActiveByBikeId(bikeId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.rental.findFirst({
              where: { bikeId, status: "RENTED" as RentalStatus },
              select,
            }),
          catch: (e) =>
            new RentalRepositoryError({
              operation: "findActiveByBikeId",
              cause: e,
            }),
        });

        return Option.fromNullable(raw).pipe(Option.map(mapToRentalRow));
      });
    },

    findActiveByUserId(userId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.rental.findFirst({
              where: { userId, status: "RENTED" as RentalStatus },
              select,
            }),
          catch: (e) =>
            new RentalRepositoryError({
              operation: "findActiveByUserId",
              cause: e,
            }),
        });

        return Option.fromNullable(raw).pipe(Option.map(mapToRentalRow));
      });
    },

    createRental(data) {
      return createRentalWithClient(client, data);
    },

    createReservedRentalForReservation(data) {
      return Effect.tryPromise({
        try: () =>
          client.rental.create({
            data: {
              id: data.reservationId,
              userId: data.userId,
              bikeId: data.bikeId,
              startStationId: data.startStationId,
              startTime: data.startTime,
              status: "RESERVED",
              subscriptionId: data.subscriptionId ?? null,
            },
            select,
          }),
        catch: (error) =>
          Match.value(error).pipe(
            Match.when(
              isPrismaUniqueViolation,
              (e) =>
                new RentalUniqueViolation({
                  operation: "createReservedRentalForReservation",
                  constraint: uniqueTargets(e),
                  cause: e,
                }),
            ),
            Match.orElse(
              (e) =>
                new RentalRepositoryError({
                  operation: "createReservedRentalForReservation",
                  cause: e,
                }),
            ),
          ),
      }).pipe(Effect.map(mapToRentalRow));
    },

    updateRentalOnEnd(data) {
      return Effect.tryPromise({
        try: async () => {
          const updated = await client.rental.updateMany({
            where: {
              id: data.rentalId,
              status: "RENTED",
            },
            data: {
              endStationId: data.endStationId,
              endTime: data.endTime,
              duration: data.durationMinutes,
              totalPrice:
                data.totalPrice === null ? null : String(data.totalPrice),
              status: data.newStatus,
            },
          });

          if (updated.count === 0) {
            return null;
          }

          return await client.rental.findUnique({
            where: { id: data.rentalId },
            select,
          });
        },
        catch: (e) =>
          new RentalRepositoryError({
            operation: "updateRentalOnEnd",
            cause: e,
          }),
      }).pipe(
        Effect.map((row) =>
          Option.fromNullable(row).pipe(Option.map(mapToRentalRow)),
        ),
      );
    },

    findById(rentalId) {
      return Effect.tryPromise({
        try: () =>
          client.rental.findUnique({
            where: { id: rentalId },
            select,
          }),
        catch: (e) =>
          new RentalRepositoryError({
            operation: "findById",
            cause: e,
          }),
      }).pipe(
        Effect.map((row) =>
          Option.fromNullable(row).pipe(Option.map(mapToRentalRow)),
        ),
      );
    },

    assignBikeToReservedRental(rentalId, bikeId, updatedAt) {
      return Effect.tryPromise({
        try: async () => {
          const updated = await client.rental.updateMany({
            where: {
              id: rentalId,
              bikeId: null,
              status: "RESERVED",
            },
            data: {
              bikeId,
              updatedAt,
            },
          });
          return updated.count > 0;
        },
        catch: (e) =>
          new RentalRepositoryError({
            operation: "assignBikeToReservedRental",
            cause: e,
          }),
      });
    },

    startReservedRental(rentalId, startTime, updatedAt, subscriptionId) {
      return Effect.tryPromise({
        try: async () => {
          const updated = await client.rental.updateMany({
            where: {
              id: rentalId,
              status: "RESERVED",
            },
            data: {
              status: "RENTED",
              startTime,
              updatedAt,
              subscriptionId,
            },
          });
          return updated.count > 0;
        },
        catch: (e) =>
          new RentalRepositoryError({
            operation: "startReservedRental",
            cause: e,
          }),
      });
    },

    cancelReservedRental(rentalId, updatedAt) {
      return Effect.tryPromise({
        try: async () => {
          const updated = await client.rental.updateMany({
            where: {
              id: rentalId,
              status: "RESERVED",
            },
            data: {
              status: "CANCELLED",
              updatedAt,
            },
          });
          return updated.count > 0;
        },
        catch: (e) =>
          new RentalRepositoryError({
            operation: "cancelReservedRental",
            cause: e,
          }),
      });
    },

    adminListRentals(filter, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where = toAdminRentalsWhere(filter);
        const orderBy = toRentalOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.rental.count({ where }),
            catch: (e) =>
              new RentalRepositoryError({
                operation: "adminListRentals.count",
                cause: e,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.rental.findMany({
                where,
                skip,
                take,
                orderBy,
                select: adminRentalListSelect,
              }),
            catch: (e) =>
              new RentalRepositoryError({
                operation: "adminListRentals.findMany",
                cause: e,
              }),
          }),
        ]);

        const mappedItems: AdminRentalListItem[] = items.map(
          mapToAdminRentalListItem,
        );

        return makePageResult(mappedItems, total, page, pageSize);
      });
    },

    adminGetRentalById(rentalId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.rental.findUnique({
              where: { id: rentalId },
              select: adminRentalDetailSelect,
            }),
          catch: (e) =>
            new RentalRepositoryError({
              operation: "adminGetRentalById",
              cause: e,
            }),
        });

        if (!raw) {
          return Option.none();
        }
        return Option.some(mapToAdminRentalDetail(raw));
      });
    },

    listActiveRentalsByPhone(phoneNumber, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);
        const orderBy = toRentalOrderBy(pageReq);

        const where = {
          status: "RENTED",
          bikeId: { not: null },
          user: { phoneNumber },
        } satisfies PrismaTypes.RentalWhereInput;

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.rental.count({ where }),
            catch: (e) =>
              new RentalRepositoryError({
                operation: "listActiveRentalsByPhone.count",
                cause: e,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.rental.findMany({
                where,
                skip,
                take,
                orderBy,
                select: adminRentalListSelect,
              }),
            catch: (e) =>
              new RentalRepositoryError({
                operation: "listActiveRentalsByPhone.findMany",
                cause: e,
              }),
          }),
        ]);

        const mappedItems: AdminRentalListItem[] = items.map(
          mapToAdminRentalListItem,
        );

        return makePageResult(mappedItems, total, page, pageSize);
      });
    },

    requestBikeSwap(rentalId, userId, oldBikeId, stationId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.bikeSwapRequest.create({
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

    staffListBikeSwapRequests(filter, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);
        const orderBy = toStaffBikeSwapRequestsOrderBy(pageReq);

        const where = toStaffBikeSwapRequestsWhere(filter);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.bikeSwapRequest.count({ where }),
            catch: (e) =>
              new RentalRepositoryError({
                operation: "staffListBikeSwapRequests.count",
                cause: e,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.bikeSwapRequest.findMany({
                where,
                skip,
                take,
                orderBy,
                select: staffBikeSwapRequestSelect,
              }),
            catch: (e) =>
              new RentalRepositoryError({
                operation: "staffListBikeSwapRequests.findMany",
                cause: e,
              }),
          }),
        ]);

        const mappedItems: StaffBikeSwapRequestRow[] = items.map(
          mapToStaffBikeSwapRequestRow,
        );

        return makePageResult(mappedItems, total, page, pageSize);
      });
    },

    staffGetBikeSwapRequests(bikeSwapRequestId) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.bikeSwapRequest.findUnique({
              where: { id: bikeSwapRequestId },
              select: staffBikeSwapRequestSelect,
            }),
          catch: (e) =>
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
            try: () => client.bikeSwapRequest.count({ where }),
            catch: (e) =>
              new RentalRepositoryError({
                operation: "adminListBikeSwapRequests.count",
                cause: e,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.bikeSwapRequest.findMany({
                where,
                skip,
                take,
                orderBy,
                select: staffBikeSwapRequestSelect,
              }),
            catch: (e) =>
              new RentalRepositoryError({
                operation: "adminListBikeSwapRequests.findMany",
                cause: e,
              }),
          }),
        ]);

        const mappedItems: StaffBikeSwapRequestRow[] = items.map(
          mapToStaffBikeSwapRequestRow,
        );

        return makePageResult(mappedItems, total, page, pageSize);
      });
    },

    staffApproveBikeSwapRequests(bikeSwapRequestId: string) {
      return approveBikeSwapRequestWithClient(client, bikeSwapRequestId);
    },

    staffRejectBikeSwapRequests(bikeSwapRequestId: string, reason: string) {
      return Effect.gen(function* () {
        const current = yield* Effect.tryPromise({
          try: () =>
            client.bikeSwapRequest.findUnique({
              where: { id: bikeSwapRequestId },
              select: { status: true },
            }),
          catch: (e) =>
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
            client.bikeSwapRequest.update({
              where: { id: bikeSwapRequestId },
              data: {
                status: "REJECTED" as BikeSwapStatus,
                reason,
              },
              select: staffBikeSwapRequestSelect,
            }),
          catch: (e) =>
            new RentalRepositoryError({
              operation: "staffRejectBikeSwapRequests.update",
              cause: e,
            }),
        });

        return Option.some(mapToStaffBikeSwapRequestRow(raw as any));
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
