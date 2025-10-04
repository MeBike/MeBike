import type { Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ObjectId } from "mongodb";

import type { ReportStatus } from "~/constants/enums";
import type { CreateReportReqBody } from "~/models/requests/reports.requests";
import type User from "~/models/schemas/user.schema";

import { REPORTS_MESSAGES } from "~/constants/messages";
import reportService from "~/services/report.services";

export async function createReportController(req: Request<ParamsDictionary, any, CreateReportReqBody>, res: Response) {
  const user = req.user as User;
  const user_id = user._id as ObjectId;

  const result = await reportService.createReport({ userID: user_id.toString(), payload: req.body });

  res.json({ message: REPORTS_MESSAGES.CREATE_SUCCESS, result });
}

export async function updateReportStatusController(req: Request<ParamsDictionary, any, any>, res: Response) {
  const { reportID } = req.params;
  const newStatus = req.body as ReportStatus;

  const result = await reportService.updateReportStatus({
    reportID: reportID.toString(),
    newStatus: newStatus as ReportStatus,
  });

  res.json({
    message: REPORTS_MESSAGES.UPDATE_SUCCESS,
    result,
  });
}
