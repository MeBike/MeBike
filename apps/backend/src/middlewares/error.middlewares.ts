import type { NextFunction, Request, Response } from "express";

import { omit } from "lodash";

import HTTP_STATUS from "~/constants/http-status";
import { EntityError, ErrorWithStatus } from "~/models/errors";

export function defaultErrorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof EntityError) {
    return res.status(err.status).json({
      message: err.message,
      errors: err.errors,
    });
  }

  if (err instanceof ErrorWithStatus) {
    res.status(err.status).json(omit(err, ["status"]));
    return;
  }
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true });
  });
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfor: omit(err, ["stack"]),
  });
}
