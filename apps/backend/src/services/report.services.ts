import type { UploadApiResponse } from "cloudinary";

import { v2 as cloudinary } from "cloudinary";
import { ObjectId } from "mongodb";
import fs from "node:fs";
import process from "node:process";
import pLimit from "p-limit";

import type { CreateReportReqBody } from "~/models/requests/reports.requests";
import type { ReportType } from "~/models/schemas/report.schema";

import { ReportStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { REPORTS_MESSAGES } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import Report from "~/models/schemas/report.schema";

import databaseService from "./database.services";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

class ReportService {
  async createReport({
    userID,
    payload,
    files,
  }: {
    userID: string;
    payload: CreateReportReqBody;
    files?: Express.Multer.File[];
  }) {
    const reportID = new ObjectId();
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    const reportData: ReportType = {
      ...payload,
      _id: reportID,
      message: payload.message,
      type: payload.type,
      status: ReportStatus.Pending,
      created_at: localTime,
      location: payload.location,
    };

    if (payload.station_id)
      reportData.station_id = new ObjectId(payload.station_id);
    if (payload.rental_id)
      reportData.rental_id = new ObjectId(payload.rental_id);
    if (userID)
      reportData.user_id = new ObjectId(userID);
    if (payload.bike_id)
      reportData.bike_id = new ObjectId(payload.bike_id);

    if (files && files.length === 0) {
      const limit = pLimit(3);
      const media_urls = await Promise.all(
        files.map(file =>
          limit(async () => {
            const fileUpload = await cloudinary.uploader.upload_large(file.path, {
              resource_type: "auto",
              folder: "reports",
              chunk_size: 6_000_000,
            });
            fs.unlinkSync(file.path);
            return (fileUpload as UploadApiResponse).secure_url;
          }),
        ),
      );
      reportData.media_urls = media_urls;
    }

    const result = await databaseService.reports.insertOne(new Report(reportData));
    return result;
  }

  async updateReportStatus({ reportID, newStatus }: { reportID: string; newStatus: ReportStatus }) {
    const validTransitions: Record<ReportStatus, ReportStatus[]> = {
      [ReportStatus.Pending]: [ReportStatus.InProgress, ReportStatus.Cancel],
      [ReportStatus.InProgress]: [ReportStatus.Resolved],
      [ReportStatus.Resolved]: [],
      [ReportStatus.Cancel]: [],
    };

    const findReport = await databaseService.reports.findOne({ _id: new ObjectId(reportID) });
    if (!findReport) {
      throw new ErrorWithStatus({
        message: REPORTS_MESSAGES.REPORT_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    const currentStatus = findReport.status;
    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new ErrorWithStatus({
        message: REPORTS_MESSAGES.INVALID_NEW_STATUS,
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const result = await databaseService.reports.findOneAndUpdate(
      { _id: new ObjectId(reportID) },
      { $set: { status: newStatus } },
      { returnDocument: "after" },
    );
    return result;
  }
}

const reportService = new ReportService();
export default reportService;
