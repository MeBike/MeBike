import type { UserRole } from "generated/prisma/enums";

/**
 * Ngữ cảnh phân quyền của người đang xác nhận trả xe.
 *
 * Giá trị này có thể đến trực tiếp từ input đã được resolve trước,
 * hoặc được nạp từ database khi caller chỉ truyền `confirmedByUserId`.
 */
export type ConfirmReturnOperatorScope = {
  readonly role: UserRole;
  readonly stationId: string | null;
  readonly agencyId: string | null;
};
