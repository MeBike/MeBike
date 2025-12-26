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

const RentalReposLive = RentalRepositoryLive.pipe(
  Layer.provide(Prisma.Default),
);

const RentalServiceLayer = RentalServiceLive.pipe(
  Layer.provide(RentalReposLive),
  Layer.provide(BikeReposLive),
);

const WalletReposLive = WalletRepositoryLive.pipe(
  Layer.provide(Prisma.Default),
);

const WalletServiceLayer = WalletServiceLive.pipe(
  Layer.provide(WalletReposLive),
);

export const WalletDepsLive = Layer.mergeAll(
  WalletReposLive,
  WalletServiceLayer,
  Prisma.Default,
);

export const RentalDepsLive = Layer.mergeAll(
  RentalReposLive,
  RentalServiceLayer,
  BikeDepsLive,
  WalletDepsLive,
  Prisma.Default,
);

export function withRentalDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(
    Effect.provide(RentalDepsLive),
    Effect.provide(Prisma.Default),
  );
}

const SupplierReposLive = SupplierRepositoryLive.pipe(
  Layer.provide(Prisma.Default),
);

const SupplierServiceLayer = SupplierServiceLive.pipe(
  Layer.provide(SupplierReposLive),
);

export const SupplierDepsLive = Layer.mergeAll(
  SupplierReposLive,
  SupplierServiceLayer,
  Prisma.Default,
);

export function withSupplierDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(SupplierDepsLive));
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
  Layer.provide(Prisma.Default),
);

const AuthUserServiceLayer = UserServiceLive.pipe(
  Layer.provide(AuthReposLive),
);

export const AuthDepsLive = Layer.mergeAll(
  AuthReposLive,
  AuthServiceLayer,
  AuthUserServiceLayer,
  Email.Default,
  Redis.Default,
  Prisma.Default,
);

export function withAuthDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(AuthDepsLive));
}

const UserReposLive = UserRepositoryLive.pipe(
  Layer.provide(Prisma.Default),
);

const UserServiceLayer = UserServiceLive.pipe(
  Layer.provide(UserReposLive),
);

export const UserDepsLive = Layer.mergeAll(
  UserReposLive,
  UserServiceLayer,
  Prisma.Default,
);

export function withUserDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(UserDepsLive));
}

const UserStatsServiceLayer = UserStatsServiceLive.pipe(
  Layer.provide(UserStatsRepositoryLive),
);

export const UserStatsDepsLive = Layer.mergeAll(
  UserStatsRepositoryLive,
  UserStatsServiceLayer,
);

export function withUserStatsDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(UserStatsDepsLive));
}

const RatingReposLive = Layer.mergeAll(
  RatingRepositoryLive,
  RatingReasonRepositoryLive,
).pipe(
  Layer.provide(Prisma.Default),
);

const RatingServiceLayer = RatingServiceLive.pipe(
  Layer.provide(RatingRepositoryLive),
  Layer.provide(Prisma.Default),
);

export const RatingDepsLive = Layer.mergeAll(
  RatingReposLive,
  RatingServiceLayer,
  RentalReposLive,
  RentalServiceLayer,
  Prisma.Default,
);

export function withRatingDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(
    Effect.provide(RatingDepsLive),
    Effect.provide(Prisma.Default),
  );
}

export function withWalletDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(WalletDepsLive));
}

const SubscriptionReposLive = SubscriptionRepositoryLive.pipe(
  Layer.provide(Prisma.Default),
);

const SubscriptionServiceLayer = SubscriptionServiceLive.pipe(
  Layer.provide(SubscriptionReposLive),
);

export const SubscriptionDepsLive = Layer.mergeAll(
  SubscriptionReposLive,
  SubscriptionServiceLayer,
  WalletDepsLive,
  UserDepsLive,
  Email.Default,
  Prisma.Default,
);

export function withSubscriptionDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(SubscriptionDepsLive));
}
