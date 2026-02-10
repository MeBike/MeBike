import { Effect, Option } from "effect";

import { Prisma } from "@/infrastructure/prisma";

import type { BikeRow } from "../models";

import {
  BikeCurrentlyRented,
  BikeCurrentlyReserved,
  BikeNotFound,
} from "../domain-errors";
import { BikeRepository } from "../repository/bike.repository";

export function softDeleteBikeUseCase(bikeId: string): Effect.Effect<
  Option.Option<BikeRow>,
  BikeCurrentlyRented | BikeCurrentlyReserved | BikeNotFound,
  BikeRepository | Prisma
> {
  return Effect.gen(function* () {
    const repo = yield* BikeRepository;
    const { client } = yield* Prisma;

    const current = yield* repo.getById(bikeId).pipe(
      Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
    );
    if (Option.isNone(current)) {
      return yield* Effect.fail(new BikeNotFound({ id: bikeId }));
    }

    const activeRental = yield* Effect.tryPromise({
      try: () =>
        client.rental.findFirst({
          where: { bikeId, status: { in: ["RENTED", "RESERVED"] } },
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

    return yield* repo.updateStatus(bikeId, "UNAVAILABLE").pipe(
      Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
    );
  });
}
