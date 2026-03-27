import { Effect, Layer } from "effect";

import {
  PaymentAttemptRepositoryLive,
  StripeTopupServiceLive,
} from "@/domain/wallets/topups";

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

export function withStripeTopupDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(StripeTopupDepsLive));
}
