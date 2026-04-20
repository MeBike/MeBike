import { Effect, Option } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import { makeBikeRepository } from "@/domain/bikes";
import { isPastRentalReturnDeadline, makePricingPolicyRepository } from "@/domain/pricing";
import { makeRentalRepository } from "@/domain/rentals/repository/rental.repository";
import { forfeitRentalDepositHoldInTx } from "@/domain/rentals/services/rental-deposit-hold.service";
import logger from "@/lib/logger";

export type RentalOverdueSweepSummary = {
  scanned: number;
  overdue: number;
  skipped: number;
  failed: number;
  depositForfeited: number;
  bikeUnavailable: number;
};

const overdueRentalSelect = {
  id: true,
  userId: true,
  bikeId: true,
  depositHoldId: true,
  pricingPolicyId: true,
  startTime: true,
} as const;

type OverdueRentalRow = {
  id: string;
  userId: string;
  bikeId: string;
  depositHoldId: string | null;
  pricingPolicyId: string | null;
  startTime: Date;
};

export async function sweepOverdueRentals(
  client: PrismaClient,
  now = new Date(),
): Promise<RentalOverdueSweepSummary> {
  const rentals = await client.rental.findMany({
    where: {
      status: "RENTED",
    },
    select: overdueRentalSelect,
  });

  const summary: RentalOverdueSweepSummary = {
    scanned: rentals.length,
    overdue: 0,
    skipped: 0,
    failed: 0,
    depositForfeited: 0,
    bikeUnavailable: 0,
  };

  for (const rental of rentals as OverdueRentalRow[]) {
    try {
      const outcome = await client.$transaction(async (tx) => {
        const txRentalRepo = makeRentalRepository(tx);
        const txBikeRepo = makeBikeRepository(tx);
        const txPricingPolicyRepo = makePricingPolicyRepository(tx);

        const pricingPolicy = rental.pricingPolicyId
          ? await Effect.runPromise(
              txPricingPolicyRepo.getById(rental.pricingPolicyId).pipe(
                Effect.catchTag("PricingPolicyNotFound", () => txPricingPolicyRepo.getActive()),
              ),
            )
          : await Effect.runPromise(txPricingPolicyRepo.getActive());

        if (!isPastRentalReturnDeadline(rental.startTime, now, pricingPolicy.lateReturnCutoff)) {
          return { outcome: "SKIPPED" as const };
        }

        const updatedRental = await Effect.runPromise(
          txRentalRepo.markOverdueUnreturned({
            rentalId: rental.id,
            overdueAt: now,
          }),
        );

        if (Option.isNone(updatedRental)) {
          return { outcome: "SKIPPED" as const };
        }

        const updatedBike = await Effect.runPromise(
          txBikeRepo.updateStatusAt(rental.bikeId, "UNAVAILABLE", now),
        );

        return {
          outcome: "OVERDUE" as const,
          bikeUnavailable: Option.isSome(updatedBike),
          depositHoldId: rental.depositHoldId,
          userId: rental.userId,
        };
      });

      if (outcome.outcome === "SKIPPED") {
        summary.skipped += 1;
        continue;
      }

      summary.overdue += 1;

      if (outcome.bikeUnavailable) {
        summary.bikeUnavailable += 1;
      }
      else {
        summary.failed += 1;
        logger.warn({ rentalId: rental.id, bikeId: rental.bikeId }, "Overdue sweep could not mark bike unavailable");
      }

      if (!outcome.depositHoldId) {
        continue;
      }

      const holdId = outcome.depositHoldId;

      try {
        const forfeited = await client.$transaction(async tx =>
          Effect.runPromise(
            forfeitRentalDepositHoldInTx({
              tx,
              holdId,
              userId: outcome.userId,
              rentalId: rental.id,
              forfeitedAt: now,
            }),
          ),
        );

        if (forfeited) {
          summary.depositForfeited += 1;
        }
        else {
          summary.failed += 1;
          logger.warn({ rentalId: rental.id, holdId }, "Overdue sweep could not forfeit deposit hold");
        }
      }
      catch (error) {
        summary.failed += 1;
        logger.error({ error, rentalId: rental.id, holdId }, "Overdue sweep deposit forfeiture failed");
      }
    }
    catch (error) {
      summary.failed += 1;
      logger.error({ error, rentalId: rental.id }, "Overdue sweep failed for rental");
    }
  }

  return summary;
}
