import type { ObjectId } from "mongodb";

export type CreateRentalReqBody = {
  bike_id: ObjectId;
  start_station: ObjectId;
};

export type EndRentalReqBody = {
  end_station: string | ObjectId;
};

export type RentalParams = {
  id: string;
};
