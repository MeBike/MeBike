import type { BikeStatus } from "generated/prisma/enums";

export type BikeRow = {
  id: string;
  chipId: string;
  stationId: string | null;
  supplierId: string | null;
  status: BikeStatus;
};
export type BikeFilter = {
  stationId?: string;
  id?: string;
  supplierId?: string;
  status?: BikeStatus;
};
export type BikeSortField = "status" | "name";
