import type { BikeStatus } from "../../../generated/prisma/client";

export type BikeRow = {
  id: string;
  chipId: string;
  stationId: string | null;
  supplierId: string | null;
  status: BikeStatus;
};
export type BikeFilter = {
  id?: string;
  supplierId?: string;
  status?: BikeStatus;
};
export type BikeSortField = "status" | "name";
