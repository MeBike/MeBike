import type { Effect } from "effect";

import { Layer } from "effect";

import { BikeRepositoryLive } from "@/domain/bikes";
import {
  EnvironmentImpactRepositoryLive,
  EnvironmentImpactServiceLive,
  EnvironmentPolicyRepositoryLive,
  EnvironmentPolicyServiceLive,
} from "@/domain/environment";
import { ReturnSlotRepositoryLive } from "@/domain/rentals";
import {
  ReservationQueryRepositoryLive,
} from "@/domain/reservations";
import {
  StationQueryRepositoryLive,
} from "@/domain/stations/repository/station-query.repository";
import {
  SubscriptionCommandRepositoryLive,
  SubscriptionCommandServiceLive,
  SubscriptionQueryRepositoryLive,
  SubscriptionQueryServiceLive,
} from "@/domain/subscriptions";
import {
  UserQueryRepositoryLive,
  UserQueryServiceLive,
} from "@/domain/users";
import {
  PaymentAttemptRepositoryLive,
  StripeTopupServiceLive,
  StripeWithdrawalServiceLive,
  WalletHoldRepositoryLive,
  WalletHoldServiceLive,
  WalletRepositoryLive,
  WalletServiceLive,
  WithdrawalRepositoryLive,
  WithdrawalServiceLive,
} from "@/domain/wallets";
import { PrismaLive } from "@/infrastructure/prisma";
import { StripeLive } from "@/infrastructure/stripe";

const BikeReposLive = BikeRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const ReservationQueryReposLive = ReservationQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const StationQueryReposLive = StationQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const UserQueryReposLive = UserQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const UserQueryServiceLayer = UserQueryServiceLive.pipe(
  Layer.provide(UserQueryReposLive),
);

const SubscriptionReposLive = Layer.mergeAll(
  SubscriptionQueryRepositoryLive,
  SubscriptionCommandRepositoryLive,
).pipe(
  Layer.provide(PrismaLive),
);

const SubscriptionServiceLayer = Layer.mergeAll(
  SubscriptionQueryServiceLive,
  SubscriptionCommandServiceLive,
).pipe(
  Layer.provide(SubscriptionReposLive),
);

const EnvironmentPolicyReposLive = EnvironmentPolicyRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const EnvironmentImpactReposLive = EnvironmentImpactRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const EnvironmentPolicyServiceLayer = EnvironmentPolicyServiceLive.pipe(
  Layer.provide(EnvironmentPolicyReposLive),
);

const EnvironmentImpactServiceLayer = EnvironmentImpactServiceLive.pipe(
  Layer.provide(EnvironmentImpactReposLive),
  Layer.provide(EnvironmentPolicyServiceLayer),
);

const WalletReposLive = WalletRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const WalletHoldReposLive = WalletHoldRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const WalletServiceLayer = WalletServiceLive.pipe(
  Layer.provide(WalletReposLive),
);

const WalletHoldServiceLayer = WalletHoldServiceLive.pipe(
  Layer.provide(WalletHoldReposLive),
);

const PaymentAttemptReposLive = PaymentAttemptRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const StripeTopupServiceLayer = StripeTopupServiceLive.pipe(
  Layer.provide(PaymentAttemptReposLive),
  Layer.provide(StripeLive),
);

const WithdrawalReposLive = WithdrawalRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const WithdrawalServiceLayer = WithdrawalServiceLive.pipe(
  Layer.provide(WithdrawalReposLive),
);

const StripeWithdrawalServiceLayer = StripeWithdrawalServiceLive.pipe(
  Layer.provide(StripeLive),
);

const ReturnSlotReposLive = ReturnSlotRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const WorkerRuntimeLive = Layer.mergeAll(
  PrismaLive,
  StripeLive,
  BikeReposLive,
  ReservationQueryReposLive,
  StationQueryReposLive,
  UserQueryReposLive,
  UserQueryServiceLayer,
  SubscriptionReposLive,
  SubscriptionServiceLayer,
  EnvironmentPolicyReposLive,
  EnvironmentImpactReposLive,
  EnvironmentPolicyServiceLayer,
  EnvironmentImpactServiceLayer,
  WalletReposLive,
  WalletHoldReposLive,
  WalletServiceLayer,
  WalletHoldServiceLayer,
  PaymentAttemptReposLive,
  StripeTopupServiceLayer,
  WithdrawalReposLive,
  WithdrawalServiceLayer,
  StripeWithdrawalServiceLayer,
  ReturnSlotReposLive,
);

export type WorkerRuntimeEnv = Layer.Layer.Success<typeof WorkerRuntimeLive>;

export type EffectRunner<R> = <A, E>(
  effect: Effect.Effect<A, E, R>,
) => Promise<A>;

export type WorkerEffectRunner = <A, E, R extends WorkerRuntimeEnv>(
  effect: Effect.Effect<A, E, R>,
) => Promise<A>;
