import type { ObjectId } from "mongodb";

import type { ReportTypeEnum } from "../../constants/enums";

type GeoLocation = { latitude: number; longitude: number };

export type CreateReportReqBody = {
  bike_id?: ObjectId;
  station_id?: ObjectId;
  rental_id?: ObjectId;
  files?: string[];
  location?: GeoLocation;
  type: ReportTypeEnum;
  message: string;
};
