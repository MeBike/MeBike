import type { Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";

import type { ReportStatus } from "~/constants/enums";
import type { CreateReportReqBody } from "~/models/requests/reports.requests";

import { REPORTS_MESSAGES } from "~/constants/messages";
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
