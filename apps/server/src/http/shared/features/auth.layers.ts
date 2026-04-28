import { Layer } from "effect";

import { AgencyRequestRepositoryLive } from "@/domain/agency-requests/repository/agency-request.repository";
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
import { WalletCommandRepositoryLive } from "@/domain/wallets";

import { EmailLive, PrismaLive, RedisLive } from "../infra.layers";

export const AuthReposLive = Layer.mergeAll(
  AuthRepositoryLive,
  AuthEventRepositoryLive,
  AgencyRequestRepositoryLive,
  UserQueryRepositoryLive,
  UserCommandRepositoryLive,
  WalletCommandRepositoryLive,
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
