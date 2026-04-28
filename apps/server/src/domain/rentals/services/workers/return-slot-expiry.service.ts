import { Effect } from "effect";

import type { ReturnSlotRow } from "../../models";

import { ReturnSlotRepository } from "../../repository/return-slot.repository";
import { returnSlotActiveAfter } from "../commands/return-slot-expiry";

export type ReturnSlotExpirySummary = {
  readonly expired: number;
  readonly expiredSlots: readonly ReturnSlotRow[];
};

/**
 * Quét và hủy các return slot đã vượt quá thời gian giữ chỗ cấu hình.
 *
 * Service này chỉ điều phối rule ở mức cao:
 * - tính cutoff từ `now`,
 * - nhờ repository cleanup batch các slot đã quá hạn.
 *
 * @param args Input của lần sweep hiện tại.
 * @param args.now Thời điểm hiện tại dùng để tính cutoff hết hạn.
 */
export function expireReturnSlots(args: {
  readonly now: Date;
}): Effect.Effect<ReturnSlotExpirySummary, never, ReturnSlotRepository> {
  return Effect.gen(function* () {
    const repo = yield* ReturnSlotRepository;
    const cutoff = returnSlotActiveAfter(args.now);
    const expiredSlots = yield* repo.cancelActiveOlderThanReturning(cutoff, args.now);

    return { expired: expiredSlots.length, expiredSlots };
  });
}
