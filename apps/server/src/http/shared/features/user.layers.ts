import { Effect, Layer } from "effect";

import {
  UserCommandRepositoryLive,
  UserCommandServiceLive,
  UserQueryRepositoryLive,
  UserQueryServiceLive,
  UserRepositoryLive,
  UserServiceLive,
  UserStatsRepositoryLive,
  UserStatsServiceLive,
} from "@/domain/users";

import { PrismaLive } from "../infra.layers";

export const UserReposLive = UserRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const UserQueryReposLive = UserQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const UserCommandReposLive = UserCommandRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const UserQueryServiceLayer = UserQueryServiceLive.pipe(
  Layer.provide(UserQueryReposLive),
);

export const UserCommandServiceLayer = UserCommandServiceLive.pipe(
  Layer.provide(UserQueryReposLive),
  Layer.provide(UserCommandReposLive),
);

export const UserServiceLayer = UserServiceLive.pipe(
  Layer.provide(UserReposLive),
);

export const UserDepsLive = Layer.mergeAll(
  UserReposLive,
  UserQueryReposLive,
  UserCommandReposLive,
  UserQueryServiceLayer,
  UserCommandServiceLayer,
  UserServiceLayer,
  PrismaLive,
);

export function withUserDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(UserDepsLive));
}

export const UserStatsServiceLayer = UserStatsServiceLive.pipe(
  Layer.provide(UserStatsRepositoryLive),
);

export const UserStatsDepsLive = Layer.mergeAll(
  UserStatsRepositoryLive,
  UserStatsServiceLayer,
);

export function withUserStatsDeps<R, E, A>(eff: Effect.Effect<A, E, R>) {
  return eff.pipe(Effect.provide(UserStatsDepsLive));
}
