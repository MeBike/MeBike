import type { NextFunction, Request, Response } from "express";

import { ObjectId } from "mongodb";

import type { TokenPayLoad } from "~/models/requests/users.requests";

import { Role } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { USERS_MESSAGES } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import databaseService from "~/services/database.services";

export async function isStaffValidator(req: Request, res: Response, next: NextFunction) {
  try {
    const { user_id } = req.decoded_authorization as TokenPayLoad;
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
    if (user === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }
    if (user.role !== Role.Staff) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.ACCESS_DENIED_STAFF_ONLY,
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
