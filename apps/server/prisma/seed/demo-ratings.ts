import type { PrismaClient } from "../../generated/prisma/client";

import { AppliesToEnum, RentalStatus } from "../../generated/prisma/client";
import { buildDemoRatingComment } from "./demo-faker";
import { getRatingReasonPools } from "./rating-reasons";
import { replaceSeedRatingReasonLinks, upsertSeedRating } from "./seed-factories";

type DemoRatingRental = {
  readonly id: string;
  readonly userId: string;
  readonly bikeId: string | null;
  readonly startStationId: string;
  readonly endStationId: string | null;
  readonly status: RentalStatus;
};

function pick<T>(arr: readonly T[], idx: number): T {
  return arr[idx % arr.length]!;
}

export async function seedDemoRatings(
  prisma: PrismaClient,
  rentals: readonly DemoRatingRental[],
) {
  const { bikeReasons, stationReasons } = await getRatingReasonPools(prisma);

  const ratedRentals = rentals
    .filter((rental): rental is DemoRatingRental & { bikeId: string } => (
      rental.status === RentalStatus.COMPLETED && Boolean(rental.bikeId)
    ))
    .slice(0, 60);

  for (const [index, rental] of ratedRentals.entries()) {
    const rating = await upsertSeedRating(prisma, {
      rentalId: rental.id,
      userId: rental.userId,
      bikeId: rental.bikeId,
      stationId: rental.endStationId ?? rental.startStationId,
      bikeScore: 3 + (index % 3),
      stationScore: 3 + ((index + 1) % 3),
      comment: buildDemoRatingComment(index),
    });

    await replaceSeedRatingReasonLinks(prisma, rating.id, [
      ...(bikeReasons.length > 0
        ? [{
            ratingId: rating.id,
            reasonId: pick(bikeReasons, index).id,
            target: AppliesToEnum.bike,
          }]
        : []),
      ...(stationReasons.length > 0
        ? [{
            ratingId: rating.id,
            reasonId: pick(stationReasons, index).id,
            target: AppliesToEnum.station,
          }]
        : []),
    ]);
  }
}
