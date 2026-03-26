import { Layer } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { BikeRepository, makeBikeRepository } from "@/domain/bikes";
import {
  makeReturnConfirmationRepository,
  makeReturnSlotRepository,
  ReturnConfirmationRepository,
  ReturnSlotRepository,
} from "@/domain/rentals";
import {
  makeReservationRunners,
  makeReservationTestLayer,
} from "@/domain/reservations/services/test/reservation-test-kit";
import { Prisma } from "@/infrastructure/prisma";

import { makeRentalRunners } from "./rental-test-kit";

export function makeReservationRentalFlowTestKit(client: PrismaClient) {
  const reservationLayer = makeReservationTestLayer(client);
  const rentalFlowLayer = Layer.mergeAll(
    reservationLayer,
    Layer.succeed(Prisma, Prisma.make({ client })),
    Layer.succeed(BikeRepository, BikeRepository.make(makeBikeRepository(client))),
    Layer.succeed(
      ReturnSlotRepository,
      ReturnSlotRepository.make(makeReturnSlotRepository(client)),
    ),
    Layer.succeed(
      ReturnConfirmationRepository,
      ReturnConfirmationRepository.make(makeReturnConfirmationRepository(client)),
    ),
  );

  return {
    ...makeReservationRunners(reservationLayer),
    ...makeRentalRunners(rentalFlowLayer),
  };
}
