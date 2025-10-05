import type { NextFunction, Request, Response } from "express";

import type User from "~/models/schemas/user.schema";

import { Role } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { AUTH_MESSAGE } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";

export async function isAdminValidator(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as User;
    if (user.role !== Role.Admin) {
      throw new ErrorWithStatus({
        message: AUTH_MESSAGE.ACCESS_DENIED_ADMIN_ONLY,
        status: HTTP_STATUS.FORBIDDEN,
      });
    }
    next();
  }
  catch (error) {
    let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    let message = "Internal Server Error";

    if (error instanceof ErrorWithStatus) {
      status = error.status;
      message = error.message;
    }
    else if (error instanceof Error) {
      message = error.message;
    }
    res.status(status).json({ message });
  }
}

export async function isAdminOrStaffValidator(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as User;
    if (![Role.Admin, Role.Staff].includes(user.role)) {
      throw new ErrorWithStatus({
        message: AUTH_MESSAGE.ACCESS_DENIED_ADMIN_AND_STAFF_ONLY,
        status: HTTP_STATUS.FORBIDDEN,
      });
    }
    next();
  }
  catch (error) {
    let status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    let message = "Internal Server Error";

    if (error instanceof ErrorWithStatus) {
      status = error.status;
      message = error.message;
    }
    else if (error instanceof Error) {
      message = error.message;
    }
    res.status(status).json({ message });
  }
}
