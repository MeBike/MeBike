import type { BikeStatus } from "~/constants/enums";

export type CreateBikeReqBody = {
  station_id: string;
  status?: BikeStatus;
  supplier_id?: string;
  chip_id: string;
};

export type GetBikesReqQuery = {
  chip_id?: string;
  supplier_id?: string;
  station_id?: string;
  status?: BikeStatus;
  limit?: string;
  page?: string;
};

export type UpdateBikeReqBody = {
  status?: BikeStatus;
  station_id?: string;
  supplier_id?: string;
  chip_id?: string;
};