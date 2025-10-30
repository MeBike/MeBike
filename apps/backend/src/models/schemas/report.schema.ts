import { ObjectId } from "mongodb";

import type { ReportPriority, ReportTypeEnum } from "../../constants/enums";

import { ReportStatus } from "../../constants/enums";

type GeoLocation = { latitude: number; longitude: number };

export type ReportType = {
  _id?: ObjectId;
  user_id?: ObjectId;
  bike_id?: ObjectId;
  station_id?: ObjectId;
  rental_id?: ObjectId;
  assignee_id?: ObjectId;
  media_urls?: string[];
  latitude?: number;
  longitude?: number;
  priority: ReportPriority;
  type: ReportTypeEnum;
  message: string;
  status?: ReportStatus;
  created_at?: Date;
  updated_at?: Date;
};

export default class Report {
  _id?: ObjectId;
  user_id?: ObjectId;
  bike_id?: ObjectId;
  station_id?: ObjectId;
  rental_id?: ObjectId;
  assignee_id?: ObjectId;
  media_urls?: string[];
  latitude?: number;
  longitude?: number;
  priority: ReportPriority;
  type: ReportTypeEnum;
  message: string;
  status: ReportStatus;
  created_at?: Date;
  updated_at?: Date;

  constructor(report: ReportType) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    this._id = report._id || new ObjectId();
    this.user_id = report.user_id;
    this.bike_id = report.bike_id;
    this.station_id = report.station_id;
    this.rental_id = report.rental_id;
    this.assignee_id = report.assignee_id;
    this.media_urls = report.media_urls || [];
    this.longitude = report.longitude;
    this.latitude = report.latitude;
    this.priority = report.priority || "";
    this.type = report.type;
    this.message = report.message || "";
    this.status = report.status || ReportStatus.Pending;
    this.created_at = report.created_at || localTime;
    this.updated_at = report.updated_at || localTime;
  }
}
