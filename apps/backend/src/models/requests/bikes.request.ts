import type { BikeStatus } from "~/constants/enums";

export type CreateBikeReqBody = {
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
