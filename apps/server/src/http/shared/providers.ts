import { Effect } from "effect";

import {
  BikeRepositoryLive,
  BikeServiceLive,
} from "@/domain/bikes";
import {
  RentalRepositoryLive,
  RentalServiceLive,
} from "@/domain/rentals";
import {
  SupplierRepositoryLive,
  SupplierServiceLive,
} from "@/domain/suppliers";
import { Prisma } from "@/infrastructure/prisma";

export function withBikeDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(
    Effect.provide(BikeServiceLive),
    Effect.provide(BikeRepositoryLive),
    Effect.provide(Prisma.Default),
  );
}

export function withRentalDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(
    Effect.provide(RentalServiceLive),
    Effect.provide(RentalRepositoryLive),
    Effect.provide(Prisma.Default),
  );
}

export function withSupplierDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(
    Effect.provide(SupplierServiceLive),
    Effect.provide(SupplierRepositoryLive),
    Effect.provide(Prisma.Default),
  );
}
