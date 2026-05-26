import { Effect, Option } from "effect";

import { Prisma } from "@/infrastructure/prisma";

import type { BikeRow } from "../../models";

import {
  BikeCurrentlyIncidentReported,
  BikeCurrentlyRedistributing,
  BikeCurrentlyRented,
  BikeCurrentlyReserved,
  BikeNotFound,
} from "../../domain-errors";
import { BikeRepository } from "../../repository/bike.repository";

export function softDeleteBikeUseCase(bikeId: string): Effect.Effect<
  Option.Option<BikeRow>,
  | BikeCurrentlyIncidentReported
  | BikeCurrentlyRedistributing
  | BikeCurrentlyRented
  | BikeCurrentlyReserved
  | BikeNotFound,
  BikeRepository | Prisma
> {
  return Effect.gen(function* () {
    const repo = yield* BikeRepository;
    const { client } = yield* Prisma;

    const current = yield* repo.getById(bikeId);
    if (Option.isNone(current)) {
      return yield* Effect.fail(new BikeNotFound({ id: bikeId }));
    }

    const activeRental = yield* Effect.tryPromise({
      try: () =>
        client.rental.findFirst({
          where: { bikeId, status: "RENTED" },
          select: { id: true },
        }),
      catch: cause => cause,
    }).pipe(Effect.catchAll(cause => Effect.die(cause)));
    if (activeRental) {
      return yield* Effect.fail(new BikeCurrentlyRented({ bikeId, action: "delete" }));
    }

    const pendingReservation = yield* Effect.tryPromise({
      try: () =>
        client.reservation.findFirst({
          where: { bikeId, status: "PENDING" },
          select: { id: true },
        }),
      catch: cause => cause,
    }).pipe(Effect.catchAll(cause => Effect.die(cause)));
    if (pendingReservation) {
      return yield* Effect.fail(new BikeCurrentlyReserved({ bikeId, action: "delete" }));
    }

    const redistributionBike = yield* Effect.tryPromise({
      try: () =>
        client.bike.findFirst({
          where: { id: bikeId, status: { in: ["PENDING_DISPATCH", "TRANSPORTING"] } },
          select: { id: true },
        }),
      catch: cause => cause,
    }).pipe(Effect.catchAll(cause => Effect.die(cause)));
    if (redistributionBike) {
      return yield* Effect.fail(new BikeCurrentlyRedistributing({ bikeId, action: "delete" }));
    }

    const incidentBike = yield* Effect.tryPromise({
      try: () =>
        client.bike.findFirst({
          where: { id: bikeId, status: "SWAPPING" },
          select: { id: true },
        }),
      catch: cause => cause,
    }).pipe(Effect.catchAll(cause => Effect.die(cause)));
    if (incidentBike) {
      return yield* Effect.fail(new BikeCurrentlyIncidentReported({ bikeId, action: "delete" }));
    }

    return yield* repo.updateStatus(bikeId, "DISABLED");
  });
}
