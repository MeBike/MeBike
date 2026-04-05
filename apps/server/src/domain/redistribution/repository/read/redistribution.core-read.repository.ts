import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import type { RedistributionRepo } from "../redistribution.repository.types";

import { RedistributionRepositoryError } from "../../domain-errors";
import {
  mapToRedistributionRequestRow,
  redistributionRequestSelect,
} from "../redistribution.repository.query";

export type RedistributionCoreReadRepo = Pick<
  RedistributionRepo,
  "findById" | "find"
>;

export function makeRedistributionCoreReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RedistributionCoreReadRepo {
  const select = redistributionRequestSelect;

  return {
    find(where) {
      return Effect.gen(function* () {
        const raw = yield* Effect.tryPromise({
          try: () =>
            client.redistributionRequest.findUnique({
              where,
              select,
            }),
          catch: e =>
            new RedistributionRepositoryError({
              operation: "find",
              cause: e,
            }),
        });

        if (!raw) {
          return Option.none();
        }
        return Option.fromNullable(raw).pipe(Option.map(mapToRedistributionRequestRow));
      });
    },

    findById(requestId) {
      return this.find({ id: requestId });
    },
  };
}
