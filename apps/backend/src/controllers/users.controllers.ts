import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
 
import { ObjectId } from "mongodb";

import type { AdminCreateUserReqBody, AdminGetAllUsersReqQuery, AdminResetPasswordReqBody, ChangePasswordReqBody, LoginReqBody, LogoutReqBody, RefreshTokenReqBody, RegisterReqBody, ResetPasswordOtpReqBody, TokenPayLoad, UpdateUserReqBody, VerifyEmailOtpReqBody } from "~/models/requests/users.requests";
import type User from "~/models/schemas/user.schema";

import { UserVerifyStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { USERS_MESSAGES } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import databaseService from "~/services/database.services";
import usersService from "~/services/users.services";
import bcrypt from "bcryptjs";


export async function loginController(req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) {
  const user = req.user as User;
  const user_id = user._id as ObjectId;

  const result = await usersService.login({
    user_id: user_id.toString(),
    verify: user.verify,
  });

  res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result,
  });
}

export async function registerController(req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) {
  const result = await usersService.register(req.body);
  res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result,
  });
}

export async function logoutController(req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) {
  const { refresh_token } = req.body;
  const result = await usersService.logout(refresh_token);
  res.json(result);
}

export async function forgotPasswordController(req: Request, res: Response) {
  const { _id, email, fullname, verify } = req.user as User;
  const result = await usersService.forgotPassword({
    user_id: (_id as ObjectId).toString(),
    email,
    fullname,
    verify,
  });
  res.json(result);
}

export async function resetPasswordController(req: Request<ParamsDictionary, any, ResetPasswordOtpReqBody>, res: Response) {
  const { email, otp, password } = req.body;
  const user = await databaseService.users.findOne({ email });

  if (!user) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    });
  }
   if (user.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({ message: USERS_MESSAGES.USER_BANNED, status: HTTP_STATUS.FORBIDDEN });
   }
   const now = new Date();
  if (!user.forgot_password_otp || user.forgot_password_otp !== otp || (user.forgot_password_otp_expires && user.forgot_password_otp_expires < now)) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.FORGOT_PASSWORD_OTP_IS_INCORRECT_OR_EXPIRED,
      status: HTTP_STATUS.UNAUTHORIZED,
    });
  }

   const isSameAsOldPassword = bcrypt.compareSync(password, user.password);
   if (isSameAsOldPassword) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.NEW_PASSWORD_CANNOT_BE_THE_SAME_AS_OLD_PASSWORD,
        status: HTTP_STATUS.BAD_REQUEST
      });
   }

  const result = await usersService.resetPassword({ user_id: user._id.toString(), password });
  res.json(result);
}

export async function verifyEmailOtpController(req: Request<ParamsDictionary, any, VerifyEmailOtpReqBody>, res: Response) {
  const { email, otp } = req.body;

  const user = await databaseService.users.findOne({ email });

  if (!user) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    });
  }
  if (user.verify === UserVerifyStatus.Verified) {
     res.json({ message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE });
     return;
  }
  if (user.verify === UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({ message: USERS_MESSAGES.USER_BANNED, status: HTTP_STATUS.FORBIDDEN });
  }

  const now = new Date();
  if (!user.email_verify_otp || user.email_verify_otp !== otp || (user.email_verify_otp_expires && user.email_verify_otp_expires < now)) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.EMAIL_OTP_IS_INCORRECT_OR_EXPIRED,
      status: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  const result = await usersService.verifyEmail(user._id.toString());


  res.json({
    message: USERS_MESSAGES.VERIFY_EMAIL_SUCCESS,
    result,
  });
}

export async function resendEmailVerifyController(req: Request, res: Response) {
  const { user_id } = (req as Request).decoded_authorization as TokenPayLoad;
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
  if (user === null) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: 404,
    });
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE,
    });
  }
  if (user.verify === UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_BANNED,
      status: HTTP_STATUS.FORBIDDEN,
    });
  }
  const result = await usersService.resendEmailVerify(user_id);
  res.json(result);
}

export async function changePasswordController(req: Request<ParamsDictionary, any, ChangePasswordReqBody>, res: Response, _next: NextFunction) {
  const { user_id } = req.decoded_authorization as TokenPayLoad;
  const { password } = req.body;
  const result = await usersService.changePassword(user_id, password);
  res.json(result);
}

export async function getMeController(req: Request, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad;
  const user = await usersService.getMe(user_id);
  res.json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: user,
  });
}

export async function updateMeController(req: Request, res: Response) {
  const { user_id } = req.decoded_authorization as TokenPayLoad;
  const { body } = req;
  const result = await usersService.updateMe(user_id, body);
  res.json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
    result,
  });
}

export async function refreshController(req: Request<ParamsDictionary, any, RefreshTokenReqBody>, res: Response, _next: NextFunction) {
  const { refresh_token } = req.body;
  const { user_id, verify, exp } = req.decoded_refresh_token as TokenPayLoad;
  const result = await usersService.refreshToken({ user_id, verify, refresh_token, exp });
  res.json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result,
  });
}

export async function adminAndStaffGetAllUsersController(
  req: Request<ParamsDictionary, any, any, AdminGetAllUsersReqQuery>,
  res: Response,
  next: NextFunction
) {
  await usersService.adminAndStaffGetAllUsers(req, res, next)
}

export async function searchUsersController(
  req: Request<ParamsDictionary, any, any>,
  res: Response,
  next: NextFunction
){
  const { q } = req.query as { q: string };
    const users = await usersService.searchUsers(q);
    return res.json({
      message: USERS_MESSAGES.SEARCH_USERS_SUCCESSFULLY,
      data: users,
  });
}

export const getUserDetailController = async (req: Request, res: Response) => {
  const { _id } = req.params
  const user = await usersService.getUserDetail(_id)
  res.json({
    message: USERS_MESSAGES.GET_USER_DETAIL_SUCCESS,
    result: user
  })
}

export const updateUserByIdController = async (
  req: Request<{ _id: string }, any, UpdateUserReqBody>,
  res: Response
) => {
  const { _id } = req.params
  const payload = req.body

  const user = await usersService.updateUserById(_id, payload)

  res.json({
    message: USERS_MESSAGES.UPDATE_USER_INFORMATION_SUCCESS,
    result: user
  })
}

export const adminResetPasswordController = async (
  req: Request<{ _id: string }, any, AdminResetPasswordReqBody>,
  res: Response
) => {
  const { _id } = req.params
  const { new_password } = req.body

  await usersService.adminResetPassword(_id, new_password)

  res.json({
    message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
  })
}

export const getUserStatsController = async (req: Request, res: Response) => {
  const stats = await usersService.getUserStats()
  res.json({
    message: USERS_MESSAGES.GET_USER_STATS_SUCCESS,
    result: stats
  })
}

export const getAdminUserDashboardStatsController = async (req: Request, res: Response) => {
  const stats = await usersService.getAdminUserDashboardStats()
  res.json({
    message: USERS_MESSAGES.GET_USER_DASHBOARD_STATS_SUCCESS,
    result: stats
  })
}

export const getActiveUserStatsController = async (req: Request, res: Response) => {
  const { groupBy, startDate, endDate } = req.query as {
    groupBy: 'day' | 'month',
    startDate: string,
    endDate: string
  }

  const stats = await usersService.getActiveUserTimeseries(groupBy, startDate, endDate)

  res.json({
    message: USERS_MESSAGES.GET_ACTIVE_USER_STATS_SUCCESS,
    result: stats
  })
}

export const getTopRentersStatsController = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10

  const result = await usersService.getTopRentersStats(page, limit)

  res.json({
    message: USERS_MESSAGES.GET_TOP_RENTERS_STATS_SUCCESS,
    result
  })
}

export const adminCreateUserController = async (
  req: Request<ParamsDictionary, any, AdminCreateUserReqBody>,
  res: Response
) => {
  const result = await usersService.adminCreateUser(req.body)
  res.status(HTTP_STATUS.CREATED).json({
    message: USERS_MESSAGES.CREATE_USER_SUCCESS,
    result
  })
}

export const getNewUserStatsController = async (req: Request, res: Response) => {
  const stats = await usersService.getNewUserStats()
  res.json({
    message: USERS_MESSAGES.GET_NEW_USER_STATS_SUCCESS,
    result: stats
  })
}