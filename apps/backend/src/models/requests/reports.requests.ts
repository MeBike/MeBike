import type { ObjectId } from "mongodb";

import type { ReportTypeEnum } from "../../constants/enums";

export type CreateReportReqBody = {
  bike_id?: ObjectId;
  station_id?: ObjectId;
  rental_id?: ObjectId;
  files?: string[];
  latitude?: number;
  longitude?: number;
  type: ReportTypeEnum;
  message: string;
};
