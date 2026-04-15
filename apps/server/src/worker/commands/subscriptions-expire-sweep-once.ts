import { Effect } from "effect";
import process from "node:process";

import {
  SubscriptionCommandRepositoryLive,
  SubscriptionCommandServiceLive,
  SubscriptionCommandServiceTag,
  SubscriptionQueryRepositoryLive,
} from "@/domain/subscriptions";
import { PrismaLive } from "@/infrastructure/prisma";
import logger from "@/lib/logger";

async function main() {
  await Effect.runPromise(
    Effect.gen(function* () {
      const service = yield* SubscriptionCommandServiceTag;
      const expiredCount = yield* service.markExpiredNow(new Date());
      return expiredCount;
    }).pipe(
      Effect.provide(SubscriptionCommandServiceLive),
      Effect.provide(SubscriptionQueryRepositoryLive),
      Effect.provide(SubscriptionCommandRepositoryLive),
      Effect.provide(PrismaLive),
      Effect.tap(expiredCount =>
        Effect.sync(() => {
          logger.info(
            { expiredCount },
            "subscriptions-expire-sweep-once completed",
          );
        })),
    ),
  );
}

main().catch((err) => {
  logger.error({ err }, "subscriptions-expire-sweep-once failed");
  process.exit(1);
});
