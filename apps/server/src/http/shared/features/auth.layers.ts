import { Effect, Layer } from "effect";

import {
  AuthEventRepositoryLive,
  AuthRepositoryLive,
  AuthServiceLive,
} from "@/domain/auth";
import {
  UserCommandRepositoryLive,
  UserQueryRepositoryLive,
  UserQueryServiceLive,
} from "@/domain/users";
import { WalletRepositoryLive } from "@/domain/wallets";

import { EmailLive, PrismaLive, RedisLive } from "../infra.layers";

export const AuthReposLive = Layer.mergeAll(
  AuthRepositoryLive,
  AuthEventRepositoryLive,
  UserQueryRepositoryLive,
  UserCommandRepositoryLive,
  WalletRepositoryLive,
).pipe(
  Layer.provide(PrismaLive),
  Layer.provide(RedisLive),
);

export const AuthServiceLayer = AuthServiceLive.pipe(
  Layer.provide(AuthReposLive),
  Layer.provide(EmailLive),
  Layer.provide(PrismaLive),
);

export const AuthUserQueryServiceLayer = UserQueryServiceLive.pipe(
  Layer.provide(AuthReposLive),
);

export const AuthDepsLive = Layer.mergeAll(
  AuthReposLive,
  AuthServiceLayer,
  AuthUserQueryServiceLayer,
  EmailLive,
  RedisLive,
  PrismaLive,
);

export function withAuthDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(AuthDepsLive));
}
