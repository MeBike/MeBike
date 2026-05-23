import { Effect } from "effect";

import { makeBikeRepository } from "@/domain/bikes";
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
    const expireHours = config ? Number.parseInt(config.value, 10) : Number.NaN;
    const finalExpireHours = isNaN(expireHours) ? 24 : expireHours;

    const expireAfterMs = args.expireAfterMs ?? finalExpireHours * 60 * 60 * 1000;
    const cutoff = new Date(args.now.getTime() - expireAfterMs);

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
          reason: `Tự động hủy do không được phê duyệt trong vòng ${finalExpireHours} giờ.`,
          updatedAt: args.now,
        },
      }),
    );

    return { cancelled: requestIds.length };
  });
}
