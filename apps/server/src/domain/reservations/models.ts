import type { Prisma as PrismaTypes, ReservationOption, ReservationStatus } from "generated/prisma/client";

export type ReservationDecimal = PrismaTypes.Decimal;

export type ReservationRow = {
  readonly id: string;
  readonly userId: string;
  readonly bikeId: string | null;
  readonly stationId: string;
  readonly reservationOption: ReservationOption;
  readonly fixedSlotTemplateId: string | null;
  readonly subscriptionId: string | null;
  readonly startTime: Date;
  readonly endTime: Date | null;
  readonly prepaid: ReservationDecimal;
  readonly status: ReservationStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ReservationSortField = "startTime" | "endTime" | "status" | "updatedAt";

export type ReservationFilter = {
  readonly status?: ReservationStatus;
  readonly stationId?: string;
  readonly reservationOption?: ReservationOption;
};
