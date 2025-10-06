import type { Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";

import { ObjectId } from "mongodb";
import { report } from "node:process";

import type { CreateReportReqBody } from "~/models/requests/reports.requests";

import HTTP_STATUS from "~/constants/http-status";
import { REPORTS_MESSAGES } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import databaseService from "~/services/database.services";
import reportService from "~/services/report.services";

export async function createReportController(req: Request<ParamsDictionary, any, CreateReportReqBody>, res: Response) {
  const user = req.decoded_authorization;
  const user_id = user?._id as string;

  const result = await reportService.createReport({
    userID: user_id,
    payload: req.body,
    files: req.files as Express.Multer.File[],
  });

  res.json({
    message: REPORTS_MESSAGES.CREATE_SUCCESS,
    result: { acknowledged: true, insertedId: result._id },
  });
}

export async function updateReportStatusController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const { reportID } = req.params;
  const newStatus = req.body.newStatus;

  const result = await reportService.updateReportStatus({
    reportID: reportID.toString(),
    newStatus,
  });

  res.json({
    message: REPORTS_MESSAGES.UPDATE_SUCCESS,
    result,
  });
}

export async function getByIdController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const reportID = req.params.reportID;

  const result = await databaseService.reports.findOne({ _id: new ObjectId(reportID) });
  if (!result) {
    throw new ErrorWithStatus({
      message: REPORTS_MESSAGES.REPORT_NOT_FOUND.replace("%s", reportID),
      status: HTTP_STATUS.NOT_FOUND,
    });
  }

  res.json({
    message: REPORTS_MESSAGES.GET_BY_ID_SUCCESS.replace("%s", reportID),
    result,
  });
}

export async function getAllUserReportController(req: Request<any, any, any>, res: Response) {
  const user = req.decoded_authorization;
  const user_id = user?.user_id as string;

  const result = await reportService.getAllUserReport(user_id?.toString());

  res.json({
    message: REPORTS_MESSAGES.GET_USER_REPORT_SUCCESS.replace("%s", user_id),
    result,
  });
}

export async function getAllReportController(req: Request<any, any, any>, res: Response) {
  const result = await reportService.getAllReport();

  res.json({
    message: REPORTS_MESSAGES.GET_ALL_SUCCESS,
    result,
  });
}
