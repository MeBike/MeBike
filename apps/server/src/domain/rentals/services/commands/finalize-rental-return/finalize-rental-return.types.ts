import type {
  BillingPreviewDiscountRuleRow,
  CouponRuleSnapshot,
} from "@/domain/coupons";
import type { PricingPolicyRow } from "@/domain/pricing";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import type { RentalRow } from "../../../models";

/**
 * Đầu vào tối thiểu để hoàn tất một lượt trả xe trong cùng transaction.
 */
export type FinalizeRentalReturnInput = {
  readonly tx: PrismaTypes.TransactionClient;
  readonly rental: RentalRow;
  readonly bikeId: string;
  readonly endStationId: string;
  readonly endTime: Date;
};

/**
 * Kết quả tính cước và quyết định billing cho flow hoàn tất trả xe.
 */
export type FinalizeRentalReturnPricing = {
  readonly pricingPolicy: PricingPolicyRow;
  readonly durationMinutes: number;
  readonly fullBaseAmountMinor: bigint;
  readonly subscriptionDiscountMinor: bigint;
  readonly couponDiscountAmountMinor: bigint;
  readonly selectedCouponRule: BillingPreviewDiscountRuleRow | null;
  readonly couponRuleSnapshot: CouponRuleSnapshot | null;
  readonly totalPriceMinor: bigint;
  readonly depositForfeited: boolean;
};
