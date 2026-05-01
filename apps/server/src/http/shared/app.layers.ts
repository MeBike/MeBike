import { Layer } from "effect";

import { AgencyRequestDepsLive } from "./features/agency-request.layers";
import { AgencyDepsLive } from "./features/agency.layers";
import { AiDepsLive } from "./features/ai.layers";
import { AuthDepsLive } from "./features/auth.layers";
import { BikeDepsLive } from "./features/bike.layers";
import { CouponDepsLive } from "./features/coupon.layers";
import { EnvironmentDepsLive } from "./features/environment.layers";
import { IncidentDepsLive } from "./features/incident.layers";
import { PricingDepsLive } from "./features/pricing.layers";
import { RatingDepsLive } from "./features/rating.layers";
import { RedistributionRequestDepsLive } from "./features/redistribution.layers";
import { RentalDepsLive } from "./features/rental.layers";
import { ReservationDepsLive } from "./features/reservation.layers";
import { StationDepsLive } from "./features/station.layers";
import { StripeTopupDepsLive } from "./features/stripe-topup.layers";
import { SubscriptionDepsLive } from "./features/subscription.layers";
import { SupplierDepsLive } from "./features/supplier.layers";
import { TechnicianTeamDepsLive } from "./features/technician-team.layers";
import { UserDepsLive, UserStatsDepsLive } from "./features/user.layers";
import { WalletDepsLive } from "./features/wallet.layers";
import {
  StripeWebhookDepsLive,
  WithdrawalDepsLive,
} from "./features/withdrawal.layers";
import { AppInfraLive } from "./infra.layers";

export const HttpDepsLive = Layer.mergeAll(
  AgencyDepsLive,
  AiDepsLive,
  AuthDepsLive,
  BikeDepsLive,
  CouponDepsLive,
  EnvironmentDepsLive,
  PricingDepsLive,
  RatingDepsLive,
  RentalDepsLive,
  ReservationDepsLive,
  StripeTopupDepsLive,
  StripeWebhookDepsLive,
  SubscriptionDepsLive,
  StationDepsLive,
  SupplierDepsLive,
  TechnicianTeamDepsLive,
  AgencyRequestDepsLive,
  UserDepsLive,
  UserStatsDepsLive,
  WalletDepsLive,
  WithdrawalDepsLive,
  IncidentDepsLive,
  RedistributionRequestDepsLive,
).pipe(
  Layer.provide(AppInfraLive),
);
