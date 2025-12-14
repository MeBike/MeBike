import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import { Prisma } from "@/infrastructure/prisma";

import type { BikeStatus } from "../../../../generated/prisma/client";
import type {
  BikeFilter,
  BikeRow,
  BikeSortField,
} from "../models";

import {
  BikeCurrentlyRented,
  BikeCurrentlyReserved,
  BikeNotFound,
} from "../domain-errors";
import { BikeRepository } from "../repository/bike.repository";

export type BikeService = {
  listBikes: (
    filter: BikeFilter,
    pageReq: PageRequest<BikeSortField>,
  ) => Effect.Effect<PageResult<BikeRow>>;

  getBikeDetail: (bikeId: string) => Effect.Effect<Option.Option<BikeRow>>;

  reportBrokenBike: (
    bikeId: string,
  ) => Effect.Effect<Option.Option<BikeRow>>;

  adminUpdateBike: (
    bikeId: string,
    patch: Partial<{
      chipId: string;
      stationId: string;
      status: BikeStatus;
      supplierId: string | null;
    }>,
  ) => Effect.Effect<
    Option.Option<BikeRow>,
    BikeCurrentlyRented | BikeCurrentlyReserved | BikeNotFound
  >;

  softDeleteBike: (
    bikeId: string,
  ) => Effect.Effect<
    Option.Option<BikeRow>,
    BikeCurrentlyRented | BikeCurrentlyReserved | BikeNotFound
  >;
};

export class BikeServiceTag extends Context.Tag("BikeService")<
  BikeServiceTag,
  BikeService
>() {}

export const BikeServiceLive = Layer.effect(
  BikeServiceTag,
  Effect.gen(function* () {
    const repo = yield* BikeRepository;
    const { client } = yield* Prisma;

    const service: BikeService = {
      listBikes: (filter, pageReq) =>
        repo
          .listByStationWithOffset(filter.stationId, filter, pageReq)
          .pipe(
            Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
          ),

      getBikeDetail: (bikeId: string) =>
        repo.getById(bikeId).pipe(
          Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
        ),

      reportBrokenBike: (bikeId: string) =>
        repo.updateStatus(bikeId, "BROKEN").pipe(
          Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
        ),

      adminUpdateBike: (bikeId, patch) =>
        Effect.gen(function* () {
          const current = yield* repo
            .getById(bikeId)
            .pipe(
              Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
            );
          if (Option.isNone(current)) {
            return yield* Effect.fail(new BikeNotFound({ id: bikeId }));
          }

          if (patch.stationId && patch.stationId !== current.value.stationId) {
            const activeRental = yield* Effect.promise(() =>
              client.rental.findFirst({
                where: { bikeId, status: { in: ["RENTED", "RESERVED"] } },
                select: { id: true },
              }),
            );
            if (activeRental) {
              return yield* Effect.fail(
                new BikeCurrentlyRented({ bikeId, action: "update_station" }),
              );
            }

            const pendingReservation = yield* Effect.promise(() =>
              client.reservation.findFirst({
                where: { bikeId, status: "PENDING" as any },
                select: { id: true },
              }),
            );
            if (pendingReservation) {
              return yield* Effect.fail(
                new BikeCurrentlyReserved({ bikeId, action: "update_station" }),
              );
            }
          }

          const updated = yield* Effect.promise(() =>
            client.bike.update({
              where: { id: bikeId },
              data: {
                ...(patch.chipId ? { chipId: patch.chipId } : {}),
                ...(patch.stationId ? { stationId: patch.stationId } : {}),
                ...(patch.status ? { status: patch.status } : {}),
                ...(patch.supplierId !== undefined
                  ? { supplierId: patch.supplierId }
                  : {}),
              },
              select: {
                id: true,
                chipId: true,
                stationId: true,
                supplierId: true,
                status: true,
              },
            }),
          );

          return Option.some(updated);
        }),

      softDeleteBike: (bikeId: string) =>
        Effect.gen(function* () {
          const current = yield* repo
            .getById(bikeId)
            .pipe(
              Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
            );
          if (Option.isNone(current)) {
            return yield* Effect.fail(new BikeNotFound({ id: bikeId }));
          }

          const activeRental = yield* Effect.promise(() =>
            client.rental.findFirst({
              where: { bikeId, status: { in: ["RENTED", "RESERVED"] } },
              select: { id: true },
            }),
          );
          if (activeRental) {
            return yield* Effect.fail(
              new BikeCurrentlyRented({ bikeId, action: "delete" }),
            );
          }

          const pendingReservation = yield* Effect.promise(() =>
            client.reservation.findFirst({
              where: { bikeId, status: "PENDING" as any },
              select: { id: true },
            }),
          );
          if (pendingReservation) {
            return yield* Effect.fail(
              new BikeCurrentlyReserved({ bikeId, action: "delete" }),
            );
          }

          const updated = yield* repo.updateStatus(bikeId, "UNAVAILABLE").pipe(
            Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
          );
          return updated;
        }),
    };
    return service;
  }),
);
