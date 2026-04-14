import type { FixedSlotStatus } from "@/contracts/server";
import type { FixedSlotError } from "@/services/fixed-slots";

import { isFixedSlotApiError } from "@/services/fixed-slots";

type FixedSlotStatusTone = "success" | "danger";

const fixedSlotStatusLabels: Record<FixedSlotStatus, string> = {
  ACTIVE: "Đang hoạt động",
  CANCELLED: "Đã hủy",
};

const fixedSlotErrorMessages: Record<string, string> = {
  FIXED_SLOT_TEMPLATE_NOT_FOUND: "Không tìm thấy khung giờ cố định.",
  FIXED_SLOT_STATION_NOT_FOUND: "Không tìm thấy trạm đã chọn.",
  FIXED_SLOT_DATE_NOT_FUTURE: "Chỉ được chọn ngày trong tương lai.",
  FIXED_SLOT_DATE_LOCKED: "Có ngày đã bị khóa, không thể thay đổi nữa.",
  FIXED_SLOT_DATE_NOT_FOUND: "Ngày cần cập nhật không còn trong khung giờ.",
  FIXED_SLOT_TEMPLATE_CONFLICT: "Đã có khung giờ trùng vào một hoặc nhiều ngày đã chọn.",
  FIXED_SLOT_WALLET_NOT_FOUND: "Không tìm thấy ví để thanh toán.",
  FIXED_SLOT_INSUFFICIENT_BALANCE: "Số dư không đủ để tạo khung giờ cố định.",
  FIXED_SLOT_BILLING_CONFLICT: "Thanh toán khung giờ chưa thể xử lý an toàn. Thử lại sau.",
  FIXED_SLOT_TEMPLATE_CANCEL_CONFLICT: "Không thể hủy khung giờ lúc này. Thử lại sau.",
  FIXED_SLOT_TEMPLATE_UPDATE_CONFLICT: "Không thể cập nhật khung giờ lúc này. Thử lại sau.",
  UNAUTHORIZED: "Cần đăng nhập lại để tiếp tục.",
  UNKNOWN: "Không thể xử lý khung giờ cố định. Thử lại sau.",
};

export function presentFixedSlotStatus(status: FixedSlotStatus): string {
  return fixedSlotStatusLabels[status];
}

export function getFixedSlotStatusTone(status: FixedSlotStatus): FixedSlotStatusTone {
  return status === "ACTIVE" ? "success" : "danger";
}

export function presentFixedSlotError(
  error: FixedSlotError,
  fallback: string = fixedSlotErrorMessages.UNKNOWN,
): string {
  if (isFixedSlotApiError(error)) {
    return fixedSlotErrorMessages[error.code] ?? error.message ?? fallback;
  }

  if (error._tag === "NetworkError") {
    return error.message ?? fallback;
  }

  return fallback;
}
