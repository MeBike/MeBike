import type { ObjectId } from "mongodb";

import type { ReportStatus, ReportTypeEnum } from "../../constants/enums";

export type CreateReportReqBody = {
  bike_id?: ObjectId;
  station_id?: ObjectId;
  rental_id?: ObjectId;
  type: ReportTypeEnum;
  message: string;
  status?: ReportStatus;
};
