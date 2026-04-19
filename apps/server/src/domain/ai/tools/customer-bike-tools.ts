import type { z } from "zod";

import { tool } from "ai";
import { Effect, Option } from "effect";

import type { CreateCustomerToolsArgs } from "./customer-tool-helpers";

import {
  BikeDetailInputSchema,

  toBikeAiDetail,
} from "./customer-tool-helpers";
import { BikeDetailToolOutputSchema } from "./customer-tool-schemas";

export function createCustomerBikeTools(args: CreateCustomerToolsArgs) {
  return {
    getBikeDetail: tool({
      description: "Get one bike detail when the bike id is already known from screen context or prior tool results.",
      inputSchema: BikeDetailInputSchema,
      outputSchema: BikeDetailToolOutputSchema,
      execute: async (input): Promise<z.infer<typeof BikeDetailToolOutputSchema>> => {
        let bikeId = input.bikeId ?? null;

        if (!bikeId && input.reference === "context") {
          bikeId = args.context?.bikeId ?? null;
        }

        if (!bikeId) {
          return { reference: input.reference, detail: null };
        }

        const bike = await Effect.runPromise(
          args.bikeService.getBikeDetail(bikeId),
        );

        return {
          reference: input.reference,
          detail: Option.isSome(bike) ? toBikeAiDetail(bike.value) : null,
        };
      },
    }),
  } as const;
}
