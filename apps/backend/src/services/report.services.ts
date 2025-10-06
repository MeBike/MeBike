import type { Buffer } from "node:buffer";

import { v2 as cloudinary } from "cloudinary";
import { ObjectId } from "mongodb";
import process from "node:process";
import { Readable } from "node:stream";
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

function bufferToStream(buffer: Buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

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
      media_urls: [],
    };

    if (payload.station_id)
      reportData.station_id = new ObjectId(payload.station_id);
    if (payload.rental_id)
      reportData.rental_id = new ObjectId(payload.rental_id);
    if (userID)
      reportData.user_id = new ObjectId(userID);
    if (payload.bike_id)
      reportData.bike_id = new ObjectId(payload.bike_id);

    await databaseService.reports.insertOne(new Report(reportData));

    if (files && files.length > 0) {
      ;(async () => {
        try {
          const limit = pLimit(3);
          const media_urls = await Promise.all(
            files.map(file =>
              limit(async () => {
                const uploadStream = () =>
                  new Promise<string>((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                      {
                        resource_type: "auto",
                        folder: "reports",
                        chunk_size: 6_000_000,
                      },
                      (error, result) => {
                        if (error)
                          return reject(error);
                        resolve(result?.secure_url || "");
                      },
                    );
                    bufferToStream(file.buffer).pipe(stream);
                  });

                return await uploadStream();
              }),
            ),
          );

          await databaseService.reports.updateOne({ _id: reportID }, { $set: { media_urls } });
        }
        catch (error) {
          console.error("Upload report image error:", error);
        }
      })();
    }

    return { _id: reportID };
  }

  async updateReportStatus({ reportID, newStatus }: { reportID: string; newStatus: string }) {
    const allowedStatuses: Record<ReportStatus, ReportStatus[]> = {
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

    if (!Object.values(ReportStatus).includes(newStatus as ReportStatus)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: REPORTS_MESSAGES.INVALID_NEW_STATUS,
      });
    }

    const currentStatus = findReport.status as ReportStatus;
    const newStatusTyped = newStatus as ReportStatus;

    if (!allowedStatuses[currentStatus]?.includes(newStatusTyped)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: REPORTS_MESSAGES.INVALID_NEW_STATUS,
      });
    }

    const result = await databaseService.reports.findOneAndUpdate(
      { _id: new ObjectId(reportID) },
      { $set: { status: newStatusTyped } },
      { returnDocument: "after" },
    );

    return result;
  }

  async getAllUserReport(userID: string) {
    const result = await databaseService.reports.find({
      user_id: new ObjectId(userID),
      status: { $in: [ReportStatus.Pending, ReportStatus.InProgress, ReportStatus.Resolved] },
    });

    return result;
  }

  async getAllReport() {
    const result = await databaseService.reports.find();

    return result;
  }
}

const reportService = new ReportService();
export default reportService;
