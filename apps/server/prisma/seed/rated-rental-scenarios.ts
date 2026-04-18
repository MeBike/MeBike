import type { PrismaClient } from "../../generated/prisma/client";

import { replaceSeedRatingReasonLinks, upsertSeedBike, upsertSeedRating, upsertSeedRental, upsertSeedUser } from "./seed-factories";

export type RatedRentalScenario = {
  readonly user: {
    readonly email: string;
    readonly fullName: string;
    readonly phoneNumber: string;
  };
  readonly bike: {
    readonly bikeNumber: string;
  };
  readonly rental: {
    readonly id: string;
    readonly duration: number;
    readonly startTime: Date;
    readonly endTime: Date;
    readonly totalPrice: number;
  };
  readonly rating: {
    readonly bikeScore: number;
    readonly stationScore: number;
    readonly comment: string | null;
  };
};

export type RatedRentalScenarioContext = {
  readonly stationId: string;
  readonly supplierId?: string;
  readonly bikeReasonId?: string;
  readonly stationReasonId?: string;
};

export async function seedRatedRentalScenario(
  prisma: PrismaClient,
  scenario: RatedRentalScenario,
  context: RatedRentalScenarioContext,
) {
  const user = await upsertSeedUser(prisma, scenario.user);
  const bike = await upsertSeedBike(prisma, {
    bikeNumber: scenario.bike.bikeNumber,
    stationId: context.stationId,
    supplierId: context.supplierId,
  });

  await upsertSeedRental(prisma, {
    id: scenario.rental.id,
    userId: user.id,
    bikeId: bike.id,
    startStationId: context.stationId,
    endStationId: context.stationId,
    startTime: scenario.rental.startTime,
    endTime: scenario.rental.endTime,
    duration: scenario.rental.duration,
    totalPrice: scenario.rental.totalPrice,
  });

  const rating = await upsertSeedRating(prisma, {
    rentalId: scenario.rental.id,
    userId: user.id,
    bikeId: bike.id,
    stationId: context.stationId,
    bikeScore: scenario.rating.bikeScore,
    stationScore: scenario.rating.stationScore,
    comment: scenario.rating.comment,
  });

  await replaceSeedRatingReasonLinks(prisma, rating.id, [
    ...(context.bikeReasonId
      ? [{
          ratingId: rating.id,
          reasonId: context.bikeReasonId,
          target: "bike" as const,
        }]
      : []),
    ...(context.stationReasonId
      ? [{
          ratingId: rating.id,
          reasonId: context.stationReasonId,
          target: "station" as const,
        }]
      : []),
  ]);
}
