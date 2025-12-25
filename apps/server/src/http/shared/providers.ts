import { Effect, Layer } from "effect";

import {
  AuthEventRepositoryLive,
  AuthRepositoryLive,
  AuthServiceLive,
} from "@/domain/auth";
import {
  BikeRepositoryLive,
  BikeServiceLive,
  BikeStatsRepositoryLive,
  BikeStatsServiceLive,
} from "@/domain/bikes";
import {
  RatingReasonRepositoryLive,
  RatingRepositoryLive,
  RatingServiceLive,
} from "@/domain/ratings";
import {
  RentalRepositoryLive,
  RentalServiceLive,
} from "@/domain/rentals";
import {
  SubscriptionRepositoryLive,
  SubscriptionServiceLive,
} from "@/domain/subscriptions";
import {
  SupplierRepositoryLive,
  SupplierServiceLive,
} from "@/domain/suppliers";
import {
  UserRepositoryLive,
  UserServiceLive,
  UserStatsRepositoryLive,
  UserStatsServiceLive,
} from "@/domain/users";
import {
  WalletRepositoryLive,
  WalletServiceLive,
} from "@/domain/wallets";
import { Email } from "@/infrastructure/email";
import { Prisma } from "@/infrastructure/prisma";
import { Redis } from "@/infrastructure/redis";

const BikeReposLive = BikeRepositoryLive.pipe(
  Layer.provide(Prisma.Default),
);

const BikeServiceLayer = BikeServiceLive.pipe(
  Layer.provide(BikeReposLive),
  Layer.provide(Prisma.Default),
);

const BikeStatsServiceLayer = BikeStatsServiceLive.pipe(
  Layer.provide(BikeStatsRepositoryLive),
  Layer.provide(BikeReposLive),
);

export const BikeDepsLive = Layer.mergeAll(
  BikeReposLive,
  BikeStatsRepositoryLive,
  BikeServiceLayer,
  BikeStatsServiceLayer,
  Prisma.Default,
);

export function withBikeDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(BikeDepsLive));
}

export function withRentalDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(
    Effect.provide(RentalServiceLive),
    Effect.provide(RentalRepositoryLive),
    Effect.provide(BikeServiceLive),
    Effect.provide(BikeRepositoryLive),
    Effect.provide(WalletServiceLive),
    Effect.provide(WalletRepositoryLive),
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

const AuthReposLive = Layer.mergeAll(
  AuthRepositoryLive,
  AuthEventRepositoryLive,
  UserRepositoryLive,
  WalletRepositoryLive,
).pipe(
  Layer.provide(Prisma.Default),
  Layer.provide(Redis.Default),
);

const AuthServiceLayer = AuthServiceLive.pipe(
  Layer.provide(AuthReposLive),
  Layer.provide(Email.Default),
);

const UserServiceLayer = UserServiceLive.pipe(
  Layer.provide(AuthReposLive),
);

export const AuthDepsLive = Layer.mergeAll(
  AuthReposLive,
  AuthServiceLayer,
  UserServiceLayer,
  Email.Default,
  Redis.Default,
  Prisma.Default,
);

export function withAuthDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(AuthDepsLive));
}

export function withUserDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(
    Effect.provide(UserServiceLive),
    Effect.provide(UserRepositoryLive),
    Effect.provide(Prisma.Default),
  );
}

export function withUserStatsDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(
    Effect.provide(UserStatsServiceLive),
    Effect.provide(UserStatsRepositoryLive),
  );
}

export function withRatingDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(
    Effect.provide(RatingServiceLive),
    Effect.provide(RatingRepositoryLive),
    Effect.provide(RatingReasonRepositoryLive),
    Effect.provide(RentalServiceLive),
    Effect.provide(RentalRepositoryLive),
    Effect.provide(BikeServiceLive),
    Effect.provide(BikeRepositoryLive),
    Effect.provide(WalletServiceLive),
    Effect.provide(WalletRepositoryLive),
    Effect.provide(Prisma.Default),
  );
}

export function withWalletDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(
    Effect.provide(WalletServiceLive),
    Effect.provide(WalletRepositoryLive),
    Effect.provide(Prisma.Default),
  );
}

export function withSubscriptionDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(
    Effect.provide(SubscriptionServiceLive),
    Effect.provide(SubscriptionRepositoryLive),
    Effect.provide(WalletServiceLive),
    Effect.provide(WalletRepositoryLive),
    Effect.provide(UserServiceLive),
    Effect.provide(UserRepositoryLive),
    Effect.provide(Email.Default),
    Effect.provide(Prisma.Default),
  );
}
