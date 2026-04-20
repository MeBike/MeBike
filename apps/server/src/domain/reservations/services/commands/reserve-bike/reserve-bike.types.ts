import type { SubscriptionNotFound, SubscriptionNotUsable, SubscriptionUsageExceeded } from "@/domain/subscriptions/domain-errors";
import type { ReservationOption } from "generated/prisma/client";

import type { ReservationServiceFailure } from "../../../domain-errors";
import type { ReservationRow } from "../../../models";

/**
 * Public input cho flow tạo reservation hold.
 */
export type ReserveBikeInput = {
  readonly userId: string;
  readonly bikeId: string;
  readonly stationId: string;
  readonly startTime: Date;
  readonly reservationOption: ReservationOption;
  readonly subscriptionId?: string | null;
  readonly endTime?: Date | null;
  readonly now?: Date;
};

/**
 * Input nội bộ sau khi đã chốt `now` một lần cho toàn bộ transaction.
 */
export type ReserveBikeCommandInput = ReserveBikeInput & {
  readonly now: Date;
};

export type ReserveBikeFailure
  = | ReservationServiceFailure
    | SubscriptionNotFound
    | SubscriptionNotUsable
    | SubscriptionUsageExceeded
    | import("@/domain/wallets/domain-errors").WalletNotFound
    | import("@/domain/wallets/domain-errors").InsufficientWalletBalance;

/**
 * Dữ liệu read-only đã được chuẩn bị xong trước khi bước ghi side effect chạy.
 */
export type PreparedReserveBike = {
  readonly endTime: Date;
  readonly pricingPolicyId: string;
  readonly prepaidMinor: bigint;
  readonly prepaid: ReservationRow["prepaid"];
  readonly subscriptionId: string | null;
};
