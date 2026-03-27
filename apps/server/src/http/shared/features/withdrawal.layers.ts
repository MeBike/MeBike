import { Effect, Layer } from "effect";

import {
  StripeWithdrawalServiceLive,
  WithdrawalRepositoryLive,
  WithdrawalServiceLive,
} from "@/domain/wallets/withdrawals";

import { PrismaLive, StripeLive } from "../infra.layers";
import { StripeTopupDepsLive } from "./stripe-topup.layers";
import { UserDepsLive } from "./user.layers";
import { WalletDepsLive } from "./wallet.layers";

export const WithdrawalReposLive = WithdrawalRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const WithdrawalServiceLayer = WithdrawalServiceLive.pipe(
  Layer.provide(WithdrawalReposLive),
);

export const StripeWithdrawalServiceLayer = StripeWithdrawalServiceLive.pipe(
  Layer.provide(StripeLive),
);

export const WithdrawalDepsLive = Layer.mergeAll(
  WithdrawalReposLive,
  WithdrawalServiceLayer,
  StripeWithdrawalServiceLayer,
  WalletDepsLive,
  UserDepsLive,
  StripeLive,
  PrismaLive,
);

export function withWithdrawalDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(WithdrawalDepsLive));
}

export const StripeWebhookDepsLive = Layer.mergeAll(
  StripeTopupDepsLive,
  WithdrawalDepsLive,
);

export function withStripeWebhookDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(StripeWebhookDepsLive));
}
