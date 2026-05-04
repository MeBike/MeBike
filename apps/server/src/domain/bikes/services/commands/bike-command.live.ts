import { Effect, Layer } from "effect";

import { Prisma } from "@/infrastructure/prisma";

import { BikeRepository } from "../../repository/bike.repository";
import { makeBikeCommandService } from "./bike-command.service";

export type { BikeCommandService } from "./bike-command.service.types";

const makeBikeCommandServiceEffect = Effect.gen(function* () {
  const repo = yield* BikeRepository;
  const { client } = yield* Prisma;

  return makeBikeCommandService({ repo, client });
});

export class BikeCommandServiceTag extends Effect.Service<BikeCommandServiceTag>()(
  "BikeCommandService",
  {
    effect: makeBikeCommandServiceEffect,
  },
) {}

export const BikeCommandServiceLive = Layer.effect(
  BikeCommandServiceTag,
  makeBikeCommandServiceEffect.pipe(Effect.map(BikeCommandServiceTag.make)),
);
