import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { ReturnConfirmationRow } from "../models";

/**
 * Projection dùng riêng cho persistence của return confirmation.
 *
 * File này chỉ chứa select/mapping để write repository không trộn chi tiết shape
 * Prisma với thao tác ghi. Nếu cần thêm field cho `ReturnConfirmationRow`, cập
 * nhật select và mapper tại đây thay vì nhét trực tiếp vào write repository.
 */
export const returnConfirmationSelect = {
  id: true,
  rentalId: true,
  stationId: true,
  confirmedByUserId: true,
  confirmationMethod: true,
  handoverStatus: true,
  confirmedAt: true,
  createdAt: true,
} as const;

type ReturnConfirmationSelectRow = PrismaTypes.ReturnConfirmationGetPayload<{
  select: typeof returnConfirmationSelect;
}>;

/**
 * Chuẩn hóa payload Prisma thành row nội bộ của rental domain.
 *
 * Hiện tại shape Prisma trùng với `ReturnConfirmationRow`, nhưng vẫn giữ mapper
 * để boundary giữa Prisma model và domain row rõ ràng như các repository khác.
 *
 * @param raw Payload Prisma được đọc bằng `returnConfirmationSelect`.
 */
export function mapToReturnConfirmationRow(
  raw: ReturnConfirmationSelectRow,
): ReturnConfirmationRow {
  return raw;
}
