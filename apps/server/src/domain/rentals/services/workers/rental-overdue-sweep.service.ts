import { Effect, Option } from "effect";

import type { PricingPolicyRow } from "@/domain/pricing";
import type { PrismaClient } from "generated/prisma/client";

import { makeBikeRepository } from "@/domain/bikes";
import { isPastRentalReturnDeadline, makePricingPolicyRepository } from "@/domain/pricing";
import { makeRentalRepository } from "@/domain/rentals/repository/rental.repository";
import { forfeitRentalDepositHoldInTx } from "@/domain/rentals/services/commands/rental-deposit-hold.service";
import logger from "@/lib/logger";

export type RentalOverdueSweepSummary = {
  scanned: number;
  overdue: number;
  skipped: number;
  failed: number;
  depositForfeited: number;
  bikeUnavailable: number;
};

const OVERDUE_SWEEP_BATCH_SIZE = 100;
const BUSINESS_TIME_ZONE_OFFSET_MS = 7 * 60 * 60 * 1000;

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
  const pricingPolicyRepo = makePricingPolicyRepository(client);
  const activePricingPolicy = await Effect.runPromise(pricingPolicyRepo.getActive());
  const pricingPolicyCache = new Map<string, PricingPolicyRow>([
    [activePricingPolicy.id, activePricingPolicy],
  ]);
  const candidateStartUpperBound = await resolveCandidateStartUpperBound(
    client,
    now,
    activePricingPolicy.lateReturnCutoff,
  );

  const summary: RentalOverdueSweepSummary = {
    scanned: 0,
    overdue: 0,
    skipped: 0,
    failed: 0,
    depositForfeited: 0,
    bikeUnavailable: 0,
  };

  let lastRentalId: string | undefined;

  while (true) {
    const rentals = await client.rental.findMany({
      where: {
        status: "RENTED",
        startTime: {
          lt: candidateStartUpperBound,
        },
        ...(lastRentalId ? { id: { gt: lastRentalId } } : {}),
      },
      orderBy: {
        id: "asc",
      },
      take: OVERDUE_SWEEP_BATCH_SIZE,
      select: overdueRentalSelect,
    });

    if (rentals.length === 0) {
      break;
    }

    summary.scanned += rentals.length;
    lastRentalId = rentals[rentals.length - 1]?.id;

    for (const rental of rentals as OverdueRentalRow[]) {
      try {
        const pricingPolicy = await resolveRentalPricingPolicy({
          pricingPolicyRepo,
          pricingPolicyId: rental.pricingPolicyId,
          activePricingPolicy,
          cache: pricingPolicyCache,
        });

        if (!isPastRentalReturnDeadline(rental.startTime, now, pricingPolicy.lateReturnCutoff)) {
          summary.skipped += 1;
          continue;
        }

        const outcome = await client.$transaction(async (tx) => {
          const txRentalRepo = makeRentalRepository(tx);
          const txBikeRepo = makeBikeRepository(tx);

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

          if (Option.isNone(updatedBike)) {
            throw new Error(`Failed to mark bike ${rental.bikeId} unavailable for overdue rental ${rental.id}`);
          }

          if (!rental.depositHoldId) {
            return {
              outcome: "OVERDUE" as const,
              depositForfeited: false,
            };
          }

          const forfeited = await Effect.runPromise(
            forfeitRentalDepositHoldInTx({
              tx,
              holdId: rental.depositHoldId,
              userId: rental.userId,
              rentalId: rental.id,
              forfeitedAt: now,
            }),
          );

          if (!forfeited) {
            throw new Error(`Failed to forfeit deposit hold ${rental.depositHoldId} for overdue rental ${rental.id}`);
          }

          return {
            outcome: "OVERDUE" as const,
            depositForfeited: true,
          };
        });

        if (outcome.outcome === "SKIPPED") {
          summary.skipped += 1;
          continue;
        }

        summary.overdue += 1;
        summary.bikeUnavailable += 1;
        if (outcome.depositForfeited) {
          summary.depositForfeited += 1;
        }
      }
      catch (error) {
        summary.failed += 1;
        logger.error({ error, rentalId: rental.id }, "Overdue sweep failed for rental");
      }
    }
  }

  return summary;
}

/**
 * Resolve pricing policy cho từng rental với cache cục bộ trong một lần sweep.
 *
 * Mục tiêu là tránh lặp lại truy vấn cùng một policy cho nhiều rental,
 * đồng thời fallback về active policy nếu policy cũ không còn tồn tại.
 */
async function resolveRentalPricingPolicy(args: {
  pricingPolicyRepo: ReturnType<typeof makePricingPolicyRepository>;
  pricingPolicyId: string | null;
  activePricingPolicy: PricingPolicyRow;
  cache: Map<string, PricingPolicyRow>;
}): Promise<PricingPolicyRow> {
  if (!args.pricingPolicyId) {
    return args.activePricingPolicy;
  }

  const cached = args.cache.get(args.pricingPolicyId);
  if (cached) {
    return cached;
  }

  const policy = await Effect.runPromise(
    args.pricingPolicyRepo.getById(args.pricingPolicyId).pipe(
      Effect.catchTag("PricingPolicyNotFound", () => Effect.succeed(args.activePricingPolicy)),
    ),
  );
  args.cache.set(args.pricingPolicyId, policy);
  return policy;
}

/**
 * Tính mốc `startTime` lớn nhất cần quét cho lần sweep hiện tại.
 *
 * Trước giờ cutoff, chỉ cần xét các rental bắt đầu trước ngày hiện tại theo giờ Việt Nam.
 * Sau giờ cutoff, cần xét thêm các rental bắt đầu trong ngày hiện tại vì chúng đã có thể quá hạn.
 */
async function resolveCandidateStartUpperBound(
  client: PrismaClient,
  now: Date,
  fallbackCutoff: Date,
): Promise<Date> {
  const cutoffRows = await client.pricingPolicy.findMany({
    select: {
      lateReturnCutoff: true,
    },
  });

  const earliestCutoff = cutoffRows.reduce(
    (currentEarliest, row) => compareCutoffTimes(row.lateReturnCutoff, currentEarliest) < 0
      ? row.lateReturnCutoff
      : currentEarliest,
    fallbackCutoff,
  );

  const businessDayStart = startOfBusinessDayUtc(now);
  if (!isAfterCutoffInBusinessTime(now, earliestCutoff)) {
    return businessDayStart;
  }

  return new Date(businessDayStart.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Lấy mốc đầu ngày theo giờ Việt Nam nhưng trả về dưới dạng `Date` UTC.
 */
function startOfBusinessDayUtc(date: Date): Date {
  const shifted = new Date(date.getTime() + BUSINESS_TIME_ZONE_OFFSET_MS);
  return new Date(Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
    0,
    0,
    0,
    0,
  ) - BUSINESS_TIME_ZONE_OFFSET_MS);
}

/**
 * So sánh hai giá trị cutoff chỉ theo thành phần giờ-phút-giây UTC.
 */
function compareCutoffTimes(left: Date, right: Date): number {
  return (
    (left.getUTCHours() - right.getUTCHours())
    || (left.getUTCMinutes() - right.getUTCMinutes())
    || (left.getUTCSeconds() - right.getUTCSeconds())
  );
}

/**
 * Kiểm tra thời điểm hiện tại theo giờ Việt Nam đã vượt qua cutoff chưa.
 */
function isAfterCutoffInBusinessTime(now: Date, cutoff: Date): boolean {
  const shifted = new Date(now.getTime() + BUSINESS_TIME_ZONE_OFFSET_MS);

  const businessHour = shifted.getUTCHours();
  const businessMinute = shifted.getUTCMinutes();
  const businessSecond = shifted.getUTCSeconds();
  const cutoffHour = cutoff.getUTCHours();
  const cutoffMinute = cutoff.getUTCMinutes();
  const cutoffSecond = cutoff.getUTCSeconds();

  if (businessHour !== cutoffHour) {
    return businessHour > cutoffHour;
  }
  if (businessMinute !== cutoffMinute) {
    return businessMinute > cutoffMinute;
  }

  return businessSecond > cutoffSecond;
}
