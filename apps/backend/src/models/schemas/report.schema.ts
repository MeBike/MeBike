import { ObjectId } from "mongodb";

import type { ReportTypeEnum } from "../../constants/enums";

import { ReportStatus } from "../../constants/enums";

export type ReportType = {
  _id?: ObjectId;
  user_id?: ObjectId;
  bike_id?: ObjectId;
  rental_id?: ObjectId;
  type: ReportTypeEnum;
  message: string;
  status?: ReportStatus;
  created_at?: Date;
};

export default class Report {
  _id?: ObjectId;
  user_id?: ObjectId;
  bike_id?: ObjectId;
  rental_id?: ObjectId;
  type: ReportTypeEnum;
  message: string;
  status: ReportStatus;
  created_at?: Date;

  constructor(report: ReportType) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    this._id = report._id || new ObjectId();
    this.user_id = report.user_id;
    this.bike_id = report.bike_id;
    this.rental_id = report.rental_id;
    this.type = report.type;
    this.message = report.message || "";
    this.status = report.status || ReportStatus.Pending;
    this.created_at = report.created_at || localTime;
  }
}
