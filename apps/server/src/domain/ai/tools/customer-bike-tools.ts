import type { z } from "zod";

import { tool } from "ai";
import { Effect, Option } from "effect";

import type { CreateCustomerToolsArgs } from "./customer-tool-helpers";

import {
  BikeDetailInputSchema,
  formatLocalDateTime,
  toBikeAiDetail,
} from "./customer-tool-helpers";
import { BikeDetailToolOutputSchema } from "./customer-tool-schemas";

export function createCustomerBikeTools(args: CreateCustomerToolsArgs) {
  return {
    getBikeDetail: tool({
      description: "Get one bike detail when the bike id is already known from prior tool results or explicit user selection.",
      inputSchema: BikeDetailInputSchema,
      outputSchema: BikeDetailToolOutputSchema,
      execute: async (input): Promise<z.infer<typeof BikeDetailToolOutputSchema>> => {
        const bikeId = input.bikeId ?? null;

        if (!bikeId) {
          return { reference: input.reference, detail: null };
        }

        const bike = await Effect.runPromise(
          args.bikeQueryService.getBikeDetail(bikeId),
        );

        return {
          reference: input.reference,
          detail: Option.isSome(bike)
            ? {
                ...toBikeAiDetail(bike.value),
                createdAtDisplay: formatLocalDateTime(bike.value.createdAt),
                updatedAtDisplay: formatLocalDateTime(bike.value.updatedAt),
              }
            : null,
        };
      },
    }),
  } as const;
}
