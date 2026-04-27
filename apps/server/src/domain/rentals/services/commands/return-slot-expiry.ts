import { env } from "@/config/env";

/**
 * Tính mốc cutoff để xác định return slot còn đang giữ chỗ hay đã hết hạn.
 *
 * Slot chỉ còn hiệu lực khi `reservedFrom > returnSlotActiveAfter(now)`.
 *
 * @param now Thời điểm hiện tại dùng để tính cửa sổ giữ chỗ.
 */
export function returnSlotActiveAfter(now: Date): Date {
  return new Date(now.getTime() - env.RETURN_SLOT_HOLD_MINUTES * 60_000);
}
