import { Effect, Layer } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { BikeRepository } from "@/domain/bikes/repository/bike.repository";
import { Prisma } from "@/infrastructure/prisma";
import { runEffectEitherWithLayer, runEffectWithLayer } from "@/test/effect/run";

import { bikeRepositoryFactory } from "../../repository/bike.repository";
import { BikeCommandServiceLive, BikeCommandServiceTag } from "../commands/bike-command.live";

export type BikeDeps = BikeCommandServiceTag | BikeRepository | Prisma;

export function makeBikeTestLayer(client: PrismaClient) {
  const prismaLayer = Layer.succeed(Prisma, Prisma.make({ client }));
  const bikeRepoLayer = Layer.succeed(
    BikeRepository,
    BikeRepository.make(bikeRepositoryFactory(client)),
  );
  const bikeServiceLayer = BikeCommandServiceLive.pipe(
    Layer.provide(bikeRepoLayer),
    Layer.provide(prismaLayer),
  );

  return Layer.mergeAll(prismaLayer, bikeRepoLayer, bikeServiceLayer);
}

export function makeBikeRunners(layer: Layer.Layer<BikeDeps>) {
  return {
    createBike(input: {
      stationId: string;
      supplierId: string;
      status: "AVAILABLE";
    }) {
      return runEffectWithLayer(
        Effect.flatMap(BikeCommandServiceTag, service => service.createBike(input)),
        layer,
      );
    },
    createBikeEither(input: {
      stationId: string;
      supplierId: string;
      status: "AVAILABLE";
    }) {
      return runEffectEitherWithLayer(
        Effect.flatMap(BikeCommandServiceTag, service => service.createBike(input)),
        layer,
      );
    },
    adminUpdateBike(bikeId: string, input: {
      stationId?: string;
      status?: "AVAILABLE" | "BROKEN" | "DISABLED";
      supplierId?: string;
    }) {
      return runEffectWithLayer(
        Effect.flatMap(BikeCommandServiceTag, service => service.adminUpdateBike(bikeId, input)),
        layer,
      );
    },
    adminUpdateBikeEither(bikeId: string, input: {
      stationId?: string;
      status?: "AVAILABLE" | "BROKEN" | "DISABLED";
      supplierId?: string;
    }) {
      return runEffectEitherWithLayer(
        Effect.flatMap(BikeCommandServiceTag, service => service.adminUpdateBike(bikeId, input)),
        layer,
      );
    },
  };
}
