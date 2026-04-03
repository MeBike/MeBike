import { Layer } from "effect";

import { AgencyRequestDepsLive } from "./features/agency-request.layers";
import { AgencyDepsLive } from "./features/agency.layers";
import { AuthDepsLive } from "./features/auth.layers";
import { BikeDepsLive } from "./features/bike.layers";
import { IncidentDepsLive } from "./features/incident.layers";
import { NotificationDepsLive } from "./features/notification.layers";
import { RatingDepsLive } from "./features/rating.layers";
import { RentalDepsLive } from "./features/rental.layers";
import { ReservationDepsLive } from "./features/reservation.layers";
import { StationDepsLive } from "./features/station.layers";
import { StripeTopupDepsLive } from "./features/stripe-topup.layers";
import { SubscriptionDepsLive } from "./features/subscription.layers";
import { SupplierDepsLive } from "./features/supplier.layers";
import { UserDepsLive, UserStatsDepsLive } from "./features/user.layers";
import { WalletDepsLive } from "./features/wallet.layers";
import {
  StripeWebhookDepsLive,
  WithdrawalDepsLive,
} from "./features/withdrawal.layers";
import { AppInfraLive } from "./infra.layers";

export const HttpDepsLive = Layer.mergeAll(
  AgencyDepsLive,
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
  Layer.provide(AppInfraLive),
);
