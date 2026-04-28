import { Effect, Layer } from "effect";
import process from "node:process";

import {
  UserQueryRepositoryLive,
  UserQueryServiceLive,
} from "@/domain/users";
import {
  StripeWithdrawalServiceLive,
  sweepWithdrawalsUseCase,
  WalletCommandRepositoryLive,
  WalletCommandServiceLive,
  WalletHoldRepositoryLive,
  WalletQueryRepositoryLive,
  WalletQueryServiceLive,
  WithdrawalRepositoryLive,
  WithdrawalServiceLive,
} from "@/domain/wallets";
import { PrismaLive } from "@/infrastructure/prisma";
import { StripeLive } from "@/infrastructure/stripe";
import logger from "@/lib/logger";

const UserQueryReposLive = UserQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const UserQueryServiceLayer = UserQueryServiceLive.pipe(
  Layer.provide(UserQueryReposLive),
);

const WalletQueryReposLive = WalletQueryRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const WalletCommandReposLive = WalletCommandRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const WalletHoldReposLive = WalletHoldRepositoryLive.pipe(
  Layer.provide(PrismaLive),
);

const WalletQueryServiceLayer = WalletQueryServiceLive.pipe(
  Layer.provide(WalletQueryReposLive),
);

const WalletCommandServiceLayer = WalletCommandServiceLive.pipe(
  Layer.provide(WalletCommandReposLive),
  Layer.provide(WalletQueryServiceLayer),
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
  WalletQueryReposLive,
  WalletQueryServiceLayer,
  WalletCommandReposLive,
  WalletCommandServiceLayer,
  WalletHoldReposLive,
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
