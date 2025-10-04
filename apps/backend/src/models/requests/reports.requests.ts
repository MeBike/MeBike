import type { ObjectId } from "mongodb";

import type { ReportStatus, ReportTypeEnum } from "../../constants/enums";

type GeoLocation = { latitude: number; longitude: number };

export type CreateReportReqBody = {
  bike_id?: ObjectId;
  station_id?: ObjectId;
  rental_id?: ObjectId;
  media_urls?: string[];
  location?: GeoLocation;
  type: ReportTypeEnum;
  message: string;
  status?: ReportStatus;
};
