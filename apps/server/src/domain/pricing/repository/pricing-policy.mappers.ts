import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { PricingPolicyRow } from "../models";

/**
 * Shape `select` dùng chung cho pricing policy.
 *
 * Gom về một nơi giúp read path và write path luôn trả ra cùng một
 * `PricingPolicyRow`, tránh lặp lại chi tiết Prisma select ở nhiều file.
 */
export const pricingPolicySelect = {
  id: true,
  name: true,
  baseRate: true,
  billingUnitMinutes: true,
  reservationFee: true,
  depositRequired: true,
  lateReturnCutoff: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

type PricingPolicySelectRow = PrismaTypes.PricingPolicyGetPayload<{
  select: typeof pricingPolicySelect;
}>;

/**
 * Hiện tại row Prisma map 1:1 sang domain row.
 * Hàm này giữ bước chuyển đổi rõ ràng để sau này nếu shape lệch nhau thì chỉ
 * cần sửa đúng một chỗ.
 *
 * @param row Row Prisma đã được chọn theo `pricingPolicySelect`.
 * @returns Domain row ổn định cho pricing policy.
 */
export function toPricingPolicyRow(
  row: PricingPolicySelectRow,
): PricingPolicyRow {
  return row;
}
