import { Layer } from "effect";

import {
  PaymentAttemptRepositoryLive,
  StripeTopupServiceLive,
} from "@/domain/wallets";

import { PrismaLive, StripeLive } from "../infra.layers";
import { WalletDepsLive } from "./wallet.layers";

export const PaymentAttemptReposLive = PaymentAttemptRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const StripeTopupServiceLayer = StripeTopupServiceLive.pipe(
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
