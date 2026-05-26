import { Effect } from "effect";

import { makeBikeRepository } from "@/domain/bikes";
import { parseExpirePeriod } from "@/http/controllers/system-configs/system-configs.controller";
import { Prisma } from "@/infrastructure/prisma";
import { BikeStatus, RedistributionStatus } from "generated/prisma/client";

export type RedistributionPendingExpireSummary = {
  readonly cancelled: number;
};

/**
 * Quét và tự động hủy các redistribution request đang ở trạng thái PENDING_APPROVAL
 * và đã tồn tại quá thời gian cho phép (24 giờ) mà chưa được phê duyệt.
 *
 * Khi hủy, các xe gắn với request sẽ được trả lại trạng thái AVAILABLE.
 *
 * @param args Input của lần sweep hiện tại.
 * @param args.now Thời điểm hiện tại dùng để tính cutoff hết hạn.
 * @param args.expireAfterMs Số mili-giây trước khi một request hết hạn (mặc định 24 giờ).
 */
export function cancelExpiredPendingRedistributions(args: {
  readonly now: Date;
  readonly expireAfterMs?: number;
}): Effect.Effect<RedistributionPendingExpireSummary, never, Prisma> {
  return Effect.gen(function* () {
    const { client } = yield* Prisma;
    const txBikeRepo = makeBikeRepository(client);

    const config = yield* Effect.promise(() =>
      client.systemConfig.findUnique({
        where: { key: "redistribution_pending_expire_hours" },
      }),
    );

    // Parse config value — supports "24", "1.5", "24:30", "0:45"
    const DEFAULT_EXPIRE_MINUTES = 24 * 60; // 24 giờ
    const parsedMinutes = config ? parseExpirePeriod(config.value) : null;
    const finalExpireMinutes = parsedMinutes ?? DEFAULT_EXPIRE_MINUTES;

    const expireAfterMs = args.expireAfterMs ?? finalExpireMinutes * 60 * 1000;
    const cutoff = new Date(args.now.getTime() - expireAfterMs);

    const reasonHours = Math.floor(finalExpireMinutes / 60);
    const reasonMins = finalExpireMinutes % 60;
    const durationLabel
      = reasonHours > 0 && reasonMins > 0
        ? `${reasonHours} giờ ${reasonMins} phút`
        : reasonHours > 0
          ? `${reasonHours} giờ`
          : `${reasonMins} phút`;

    const expiredRequests = yield* Effect.promise(() =>
      client.redistributionRequest.findMany({
        where: {
          status: RedistributionStatus.PENDING_APPROVAL,
          createdAt: { lt: cutoff },
        },
        include: { items: true },
      }),
    );

    if (expiredRequests.length === 0) {
      return { cancelled: 0 };
    }

    const requestIds = expiredRequests.map(r => r.id);
    const bikeIds = expiredRequests.flatMap(r => r.items.map(i => i.bikeId));

    if (bikeIds.length > 0) {
      yield* txBikeRepo.updateManyStatusAt(
        bikeIds,
        BikeStatus.AVAILABLE,
        args.now,
      );
    }

    yield* Effect.promise(() =>
      client.redistributionRequest.updateMany({
        where: { id: { in: requestIds } },
        data: {
          status: RedistributionStatus.CANCELLED,
          reason: `Tự động hủy do không được phê duyệt trong vòng ${durationLabel}.`,
          updatedAt: args.now,
        },
      }),
    );

    return { cancelled: requestIds.length };
  });
}
