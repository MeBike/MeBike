import { Effect, Layer } from "effect";
import process from "node:process";

import {
  UserQueryRepositoryLive,
  UserQueryServiceLive,
} from "@/domain/users";
import {
  WalletHoldRepositoryLive,
  WalletHoldServiceLive,
  WalletRepositoryLive,
  WalletServiceLive,
} from "@/domain/wallets";
import {
  StripeWithdrawalServiceLive,
  sweepWithdrawalsUseCase,
  WithdrawalRepositoryLive,
  WithdrawalServiceLive,
} from "@/domain/wallets/withdrawals";
import { PrismaLive } from "@/infrastructure/prisma";
import { StripeLive } from "@/infrastructure/stripe";
import logger from "@/lib/logger";

const UserQueryReposLive = UserQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const UserQueryServiceLayer = UserQueryServiceLive.pipe(
  Layer.provide(UserQueryReposLive),
);

const WalletReposLive = WalletRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const WalletHoldReposLive = WalletHoldRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const WalletServiceLayer = WalletServiceLive.pipe(
  Layer.provide(WalletReposLive),
);

const WalletHoldServiceLayer = WalletHoldServiceLive.pipe(
  Layer.provide(WalletHoldReposLive),
);

const WithdrawalReposLive = WithdrawalRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const WithdrawalServiceLayer = WithdrawalServiceLive.pipe(
  Layer.provide(WithdrawalReposLive),
);

const StripeWithdrawalServiceLayer = StripeWithdrawalServiceLive.pipe(
  Layer.provide(StripeLive),
);

const WithdrawalSweepLive = Layer.mergeAll(
  UserQueryReposLive,
  UserQueryServiceLayer,
  WalletReposLive,
  WalletServiceLayer,
  WalletHoldReposLive,
  WalletHoldServiceLayer,
  WithdrawalReposLive,
  WithdrawalServiceLayer,
  StripeWithdrawalServiceLayer,
  StripeLive,
  PrismaLive,
);

async function main() {
  const summary = await Effect.runPromise(
    sweepWithdrawalsUseCase(new Date()).pipe(
      Effect.provide(WithdrawalSweepLive),
    ),
  );
  logger.info({ summary }, "wallet-withdrawal-sweep-once completed");
}

main().catch((err) => {
  logger.error({ err }, "wallet-withdrawal-sweep-once failed");
  process.exit(1);
});
