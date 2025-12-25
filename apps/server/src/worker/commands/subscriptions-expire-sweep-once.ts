import { Effect } from "effect";
import process from "node:process";

import {
  SubscriptionRepositoryLive,
  SubscriptionServiceLive,
  SubscriptionServiceTag,
} from "@/domain/subscriptions";
import { Prisma } from "@/infrastructure/prisma";
import logger from "@/lib/logger";

async function main() {
  await Effect.runPromise(
    Effect.gen(function* () {
      const service = yield* SubscriptionServiceTag;
      const expiredCount = yield* service.markExpiredNow(new Date());
      return expiredCount;
    }).pipe(
      Effect.provide(SubscriptionServiceLive),
      Effect.provide(SubscriptionRepositoryLive),
      Effect.provide(Prisma.Default),
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
