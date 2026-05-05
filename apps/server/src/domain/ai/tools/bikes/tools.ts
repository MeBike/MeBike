import type { z } from "zod";

import { tool } from "ai";
import { Effect, Option } from "effect";

import type {
  BikeToolsArgs,
  CustomerToolName,
} from "../shared/customer-tool-args";

import { BikeDetailInputSchema } from "../shared/customer-tool-inputs";
import { toBikeAiDetail } from "./presenter";
import { BikeDetailToolOutputSchema } from "./schemas";

export const customerBikeToolNames = [
  "getBikeDetail",
] as const satisfies readonly CustomerToolName[];

export const customerBikeToolNamesWithReservation = [
  ...customerBikeToolNames,
  "reserveBike",
] as const satisfies readonly CustomerToolName[];

export function createCustomerBikeTools(args: BikeToolsArgs) {
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
          detail: Option.isSome(bike) ? toBikeAiDetail(bike.value) : null,
        };
      },
    }),
  } as const;
}
