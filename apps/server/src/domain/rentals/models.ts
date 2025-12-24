import type { RentalStatus } from "generated/prisma/types";

export type RentalRow = {
  id: string;
  userId: string;
  bikeId: string | null;
  startStationId: string;
  endStationId: string | null;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  totalPrice: number | null;
  status: RentalStatus;
  updatedAt: Date;
};

export type RentalFilter = {
  status?: RentalStatus;
  startStationId?: string;
  endStationId?: string;
};

export type RentalSortField = "startTime" | "endTime" | "status" | "updatedAt";

export type MyRentalFilter = RentalFilter;

export type RentalCountsRow = {
  status: RentalStatus;
  count: number;
};

export type RentalStatusCounts = {
  RENTED: number;
  COMPLETED: number;
  CANCELLED: number;
  RESERVED: number;
};
