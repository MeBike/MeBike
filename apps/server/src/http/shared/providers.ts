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
import {
  PaymentAttemptRepositoryLive,
  StripeTopupServiceLive,
} from "@/domain/wallets/topups";
import { EmailLive } from "@/infrastructure/email";
import { PrismaLive } from "@/infrastructure/prisma";
import { RedisLive } from "@/infrastructure/redis";
import { StripeLive } from "@/infrastructure/stripe";

const BikeReposLive = BikeRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const BikeServiceLayer = BikeServiceLive.pipe(
  Layer.provide(BikeReposLive),
  Layer.provide(PrismaLive),
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
  PrismaLive,
);

export function withBikeDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(BikeDepsLive));
}

const RentalReposLive = RentalRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const RentalServiceLayer = RentalServiceLive.pipe(
  Layer.provide(RentalReposLive),
  Layer.provide(BikeReposLive),
);

const WalletReposLive = WalletRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const WalletServiceLayer = WalletServiceLive.pipe(
  Layer.provide(WalletReposLive),
);

export const WalletDepsLive = Layer.mergeAll(
  WalletReposLive,
  WalletServiceLayer,
  PrismaLive,
);

export const RentalDepsLive = Layer.mergeAll(
  RentalReposLive,
  RentalServiceLayer,
  BikeDepsLive,
  WalletDepsLive,
  PrismaLive,
);

export function withRentalDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(
    Effect.provide(RentalDepsLive),
    Effect.provide(PrismaLive),
  );
}

const SupplierReposLive = SupplierRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const SupplierServiceLayer = SupplierServiceLive.pipe(
  Layer.provide(SupplierReposLive),
);

export const SupplierDepsLive = Layer.mergeAll(
  SupplierReposLive,
  SupplierServiceLayer,
  PrismaLive,
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
  Layer.provide(PrismaLive),
  Layer.provide(RedisLive),
);

const AuthServiceLayer = AuthServiceLive.pipe(
  Layer.provide(AuthReposLive),
  Layer.provide(EmailLive),
  Layer.provide(PrismaLive),
);

const AuthUserServiceLayer = UserServiceLive.pipe(
  Layer.provide(AuthReposLive),
);

export const AuthDepsLive = Layer.mergeAll(
  AuthReposLive,
  AuthServiceLayer,
  AuthUserServiceLayer,
  EmailLive,
  RedisLive,
  PrismaLive,
);

export function withAuthDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(AuthDepsLive));
}

const UserReposLive = UserRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const UserServiceLayer = UserServiceLive.pipe(
  Layer.provide(UserReposLive),
);

export const UserDepsLive = Layer.mergeAll(
  UserReposLive,
  UserServiceLayer,
  PrismaLive,
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
  Layer.provide(PrismaLive),
);

const RatingServiceLayer = RatingServiceLive.pipe(
  Layer.provide(RatingRepositoryLive),
  Layer.provide(PrismaLive),
);

export const RatingDepsLive = Layer.mergeAll(
  RatingReposLive,
  RatingServiceLayer,
  RentalReposLive,
  RentalServiceLayer,
  PrismaLive,
);

export function withRatingDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(
    Effect.provide(RatingDepsLive),
    Effect.provide(PrismaLive),
  );
}

export function withWalletDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(WalletDepsLive));
}

const PaymentAttemptReposLive = PaymentAttemptRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const StripeTopupServiceLayer = StripeTopupServiceLive.pipe(
  Layer.provide(PaymentAttemptReposLive),
  Layer.provide(StripeLive),
);

export const StripeTopupDepsLive = Layer.mergeAll(
  PaymentAttemptReposLive,
  WalletDepsLive,
  StripeTopupServiceLayer,
  StripeLive,
  PrismaLive,
);

export function withStripeTopupDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(StripeTopupDepsLive));
}

const SubscriptionReposLive = SubscriptionRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const SubscriptionServiceLayer = SubscriptionServiceLive.pipe(
  Layer.provide(SubscriptionReposLive),
);

export const SubscriptionDepsLive = Layer.mergeAll(
  SubscriptionReposLive,
  SubscriptionServiceLayer,
  WalletDepsLive,
  UserDepsLive,
  EmailLive,
  PrismaLive,
);

export function withSubscriptionDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(SubscriptionDepsLive));
}
