import { Effect } from "effect";

import { ReturnSlotRepository } from "../../repository/return-slot.repository";
import { returnSlotActiveAfter } from "../commands/return-slot-expiry";

export type ReturnSlotExpirySummary = {
  readonly expired: number;
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
    const expired = yield* repo.cancelActiveOlderThan(cutoff, args.now);

    return { expired };
  });
}
