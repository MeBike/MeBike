export { HttpDepsLive } from "./app.layers";
export {
  AgencyRequestDepsLive,
  AgencyRequestReposLive,
  AgencyRequestServiceLayer,
} from "./features/agency-request.layers";
export {
  AuthDepsLive,
  AuthReposLive,
  AuthServiceLayer,
  AuthUserServiceLayer,
  withAuthDeps,
} from "./features/auth.layers";
export {
  BikeDepsLive,
import { Effect, Layer } from "effect";

import {
  AgencyRequestRepositoryLive,
  AgencyRequestServiceLive,
} from "@/domain/agency-requests";
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
  IncidentRepositoryLive,
  IncidentServiceLive,
} from "@/domain/incident";
import {
  PushNotificationServiceLive,
  PushTokenRepositoryLive,
} from "@/domain/notifications";
import {
  RatingReasonRepositoryLive,
  RatingRepositoryLive,
  RatingServiceLive,
} from "@/domain/ratings";
import {
  RentalAnalyticsRepositoryLive,
  RentalRepositoryLive,
  RentalServiceLive,
  RentalStatsServiceLive,
  ReturnConfirmationRepositoryLive,
  ReturnSlotRepositoryLive,
} from "@/domain/rentals";
import {
  ReservationHoldServiceLive,
  ReservationRepositoryLive,
  ReservationServiceLive,
} from "@/domain/reservations";
import {
  StationRepositoryLive,
  StationServiceLive,
} from "@/domain/stations";
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
  WalletHoldRepositoryLive,
  WalletHoldServiceLive,
  WalletRepositoryLive,
  WalletServiceLive,
} from "@/domain/wallets";
import {
  PaymentAttemptRepositoryLive,
  StripeTopupServiceLive,
} from "@/domain/wallets/topups";
import {
  StripeWithdrawalServiceLive,
  WithdrawalRepositoryLive,
  WithdrawalServiceLive,
} from "@/domain/wallets/withdrawals";
import { EmailLive } from "@/infrastructure/email";
import { PrismaLive } from "@/infrastructure/prisma";
import { RedisLive } from "@/infrastructure/redis";
import { StripeLive } from "@/infrastructure/stripe";

const BikeReposLive = BikeRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const StationReposLive = StationRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const StationServiceLayer = StationServiceLive.pipe(
  Layer.provide(StationReposLive),
);

export const StationDepsLive = Layer.mergeAll(
  StationReposLive,
  StationServiceLayer,
  PrismaLive,
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
  BikeServiceLayer,
  BikeStatsServiceLayer,
  withBikeDeps,
} from "./features/bike.layers";
export {
  NotificationDepsLive,
  PushNotificationServiceLayer,
  PushTokenReposLive,
} from "./features/notification.layers";
export {
  RatingDepsLive,
  RatingReposLive,
  RatingServiceLayer,
  withRatingDeps,
} from "./features/rating.layers";
export {
  RentalAnalyticsReposLive,
  RentalDepsLive,
  RentalReposLive,
  RentalServiceLayer,
  RentalStatsServiceLayer,
  ReturnConfirmationReposLive,
  ReturnSlotReposLive,
  withRentalDeps,
} from "./features/rental.layers";
export {
  ReservationDepsLive,
  ReservationHoldServiceLayer,
  ReservationReposLive,
  ReservationServiceLayer,
  withReservationDeps,
} from "./features/reservation.layers";
export {
  StationDepsLive,
  StationReposLive,
  StationServiceLayer,
  withStationDeps,
} from "./features/station.layers";
export {
  PaymentAttemptReposLive,
  StripeTopupDepsLive,
  StripeTopupServiceLayer,
  withStripeTopupDeps,
} from "./features/stripe-topup.layers";
export {
  SubscriptionDepsLive,
  SubscriptionReposLive,
  SubscriptionServiceLayer,
  withSubscriptionDeps,
} from "./features/subscription.layers";
export {
  SupplierDepsLive,
  SupplierReposLive,
  SupplierServiceLayer,
  PrismaLive,
);

export function withSupplierDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(SupplierDepsLive));
}

const IncidentReposLive = IncidentRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const IncidentServiceLayer = IncidentServiceLive.pipe(
  Layer.provide(IncidentReposLive),
  Layer.provide(RentalReposLive),
  Layer.provide(BikeReposLive),
  Layer.provide(StationReposLive),
);

export const IncidentDepsLive = Layer.mergeAll(
  IncidentReposLive,
  IncidentServiceLayer,
  PrismaLive,
);

export function withIncidentDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(IncidentDepsLive));
}

const PushTokenReposLive = PushTokenRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const PushNotificationServiceLayer = PushNotificationServiceLive.pipe(
  Layer.provide(PushTokenReposLive),
);

export const NotificationDepsLive = Layer.mergeAll(
  PushTokenReposLive,
  PushNotificationServiceLayer,
  PrismaLive,
);

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

const AgencyRequestReposLive = AgencyRequestRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const AgencyRequestServiceLayer = AgencyRequestServiceLive.pipe(
  Layer.provide(AgencyRequestReposLive),
);

export const UserDepsLive = Layer.mergeAll(
  withSupplierDeps,
} from "./features/supplier.layers";
export {
  UserDepsLive,
  UserReposLive,
  UserServiceLayer,
  UserStatsDepsLive,
  UserStatsServiceLayer,
  withUserDeps,
  withUserStatsDeps,
} from "./features/user.layers";
export {
  WalletDepsLive,
  WalletHoldReposLive,
  WalletHoldServiceLayer,
  WalletReposLive,
  WalletServiceLayer,
  withWalletDeps,
} from "./features/wallet.layers";
export {
  StripeWebhookDepsLive,
  StripeWithdrawalServiceLayer,
  WithdrawalDepsLive,
  WithdrawalReposLive,
  WithdrawalServiceLayer,
  withStripeWebhookDeps,
  withWithdrawalDeps,
} from "./features/withdrawal.layers";
export {
  AppInfraLive,
  EmailLive,
  ExternalInfraLive,
  PersistenceInfraLive,
  PrismaLive,
  RedisLive,
  StripeLive,
} from "./infra.layers";
);

export function withSubscriptionDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(SubscriptionDepsLive));
}

const ReservationReposLive = ReservationRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const ReservationServiceLayer = ReservationServiceLive.pipe(
  Layer.provide(ReservationReposLive),
);

const ReservationHoldServiceLayer = ReservationHoldServiceLive.pipe(
  Layer.provide(ReservationReposLive),
);

export const ReservationDepsLive = Layer.mergeAll(
  ReservationReposLive,
  ReservationServiceLayer,
  ReservationHoldServiceLayer,
  BikeReposLive,
  StationReposLive,
  UserReposLive,
  RentalReposLive,
  WalletDepsLive,
  SubscriptionReposLive,
  SubscriptionServiceLayer,
  PrismaLive,
);

export function withReservationDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(ReservationDepsLive));
}

export const HttpDepsLive = Layer.mergeAll(
  AuthDepsLive,
  BikeDepsLive,
  RatingDepsLive,
  RentalDepsLive,
  ReservationDepsLive,
  StripeTopupDepsLive,
  StripeWebhookDepsLive,
  SubscriptionDepsLive,
  StationDepsLive,
  SupplierDepsLive,
  AgencyRequestDepsLive,
  NotificationDepsLive,
  UserDepsLive,
  UserStatsDepsLive,
  WalletDepsLive,
  WithdrawalDepsLive,
  IncidentDepsLive,
).pipe(
  Layer.provide(PrismaLive),
  Layer.provide(RedisLive),
  Layer.provide(EmailLive),
  Layer.provide(StripeLive),
);
