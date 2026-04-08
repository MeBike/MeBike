import { Layer } from "effect";

import {
  WalletHoldRepositoryLive,
  WalletHoldServiceLive,
  WalletRepositoryLive,
  WalletServiceLive,
} from "@/domain/wallets";

import { PrismaLive } from "../infra.layers";

export const WalletReposLive = WalletRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const WalletHoldReposLive = WalletHoldRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

export const WalletServiceLayer = WalletServiceLive.pipe(
  Layer.provide(WalletReposLive),
);

export const WalletHoldServiceLayer = WalletHoldServiceLive.pipe(
  Layer.provide(WalletHoldReposLive),
);

export const WalletDepsLive = Layer.mergeAll(
  WalletReposLive,
  WalletServiceLayer,
  WalletHoldReposLive,
  WalletHoldServiceLayer,
  PrismaLive,
);
