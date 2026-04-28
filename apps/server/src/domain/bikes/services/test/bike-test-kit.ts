import { Effect, Layer } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { BikeRepository } from "@/domain/bikes/repository/bike.repository";
import { Prisma } from "@/infrastructure/prisma";
import { runEffectEitherWithLayer, runEffectWithLayer } from "@/test/effect/run";

import { bikeRepositoryFactory } from "../../repository/bike.repository";
import { BikeServiceLive, BikeServiceTag } from "../commands/bike-command.service";

export type BikeDeps = BikeServiceTag | BikeRepository | Prisma;

export function makeBikeTestLayer(client: PrismaClient) {
  const prismaLayer = Layer.succeed(Prisma, Prisma.make({ client }));
  const bikeRepoLayer = Layer.succeed(
    BikeRepository,
    BikeRepository.make(bikeRepositoryFactory(client)),
  );
  const bikeServiceLayer = BikeServiceLive.pipe(
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
        Effect.flatMap(BikeServiceTag, service => service.createBike(input)),
        layer,
      );
    },
    createBikeEither(input: {
      stationId: string;
      supplierId: string;
      status: "AVAILABLE";
    }) {
      return runEffectEitherWithLayer(
        Effect.flatMap(BikeServiceTag, service => service.createBike(input)),
        layer,
      );
    },
    adminUpdateBike(bikeId: string, input: {
      stationId?: string;
      status?: "AVAILABLE" | "BROKEN" | "DISABLED";
      supplierId?: string;
    }) {
      return runEffectWithLayer(
        Effect.flatMap(BikeServiceTag, service => service.adminUpdateBike(bikeId, input)),
        layer,
      );
    },
    adminUpdateBikeEither(bikeId: string, input: {
      stationId?: string;
      status?: "AVAILABLE" | "BROKEN" | "DISABLED";
      supplierId?: string;
    }) {
      return runEffectEitherWithLayer(
        Effect.flatMap(BikeServiceTag, service => service.adminUpdateBike(bikeId, input)),
        layer,
      );
    },
  };
}
