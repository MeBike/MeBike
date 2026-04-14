import type { Prisma as PrismaTypes, ReservationOption, ReservationStatus } from "generated/prisma/client";

export type CreateReservationInput = {
  readonly userId: string;
  readonly bikeId?: string | null;
  readonly stationId: string;
  readonly pricingPolicyId?: string | null;
  readonly reservationOption: ReservationOption;
  readonly fixedSlotTemplateId?: string | null;
  readonly subscriptionId?: string | null;
  readonly startTime: Date;
  readonly endTime?: Date | null;
  readonly prepaid: PrismaTypes.Decimal;
  readonly status?: ReservationStatus;
};

export type UpdateReservationStatusInput = {
  readonly reservationId: string;
  readonly status: ReservationStatus;
  readonly updatedAt?: Date;
};

export type CreateFixedSlotTemplateInput = {
  readonly userId: string;
  readonly stationId: string;
  readonly pricingPolicyId?: string | null;
  readonly subscriptionId?: string | null;
  readonly slotStart: Date;
  readonly prepaid: PrismaTypes.Decimal;
  readonly slotDates: readonly Date[];
  readonly updatedAt?: Date;
};
