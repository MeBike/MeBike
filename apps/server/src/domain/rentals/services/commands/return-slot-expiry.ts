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

/**
 * Tính thời điểm return slot hết hiệu lực từ lúc bắt đầu giữ chỗ.
 *
 * @param reservedFrom Thời điểm slot được giữ chỗ.
 */
export function returnSlotExpiresAt(reservedFrom: Date): Date {
  return new Date(reservedFrom.getTime() + env.RETURN_SLOT_HOLD_MINUTES * 60_000);
}
