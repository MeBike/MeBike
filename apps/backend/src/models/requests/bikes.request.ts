import type { BikeStatus } from "~/constants/enums";

export type CreateBikeReqBody = {
  chip_id: string;
  station_id: string;
  status?: BikeStatus;
  supplier_id?: string;
};

export type GetBikesReqQuery = {
  station_id?: string;
  status?: BikeStatus;
  limit?: string;
  page?: string;
};

export type UpdateBikeReqBody = {
  status?: BikeStatus;
  station_id?: string;
};
