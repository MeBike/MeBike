import { Layer } from "effect";

import {
  WalletCommandRepositoryLive,
  WalletCommandServiceLive,
  WalletHoldRepositoryLive,
  WalletQueryRepositoryLive,
  WalletQueryServiceLive,
} from "@/domain/wallets";

import { PrismaLive } from "../infra.layers";

export const WalletQueryReposLive = WalletQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const WalletCommandReposLive = WalletCommandRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const WalletHoldReposLive = WalletHoldRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const WalletQueryServiceLayer = WalletQueryServiceLive.pipe(
  Layer.provide(WalletQueryReposLive),
);

export const WalletCommandServiceLayer = WalletCommandServiceLive.pipe(
  Layer.provide(WalletCommandReposLive),
  Layer.provide(WalletQueryServiceLayer),
);

export const WalletQueryDepsLive = Layer.mergeAll(
  WalletQueryReposLive,
  WalletQueryServiceLayer,
  PrismaLive,
);

export const WalletCommandDepsLive = Layer.mergeAll(
  WalletCommandReposLive,
  WalletCommandServiceLayer,
  WalletQueryDepsLive,
  PrismaLive,
);

export const WalletDepsLive = Layer.mergeAll(
  WalletQueryDepsLive,
  WalletCommandDepsLive,
  WalletHoldReposLive,
  PrismaLive,
);
