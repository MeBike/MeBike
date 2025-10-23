import { Filter, ObjectId } from "mongodb";
import process from "node:process";
import nodemailer from "nodemailer";

import type { AdminGetAllUsersReqQuery, RegisterReqBody, UpdateMeReqBody, UpdateUserReqBody } from "~/models/requests/users.requests";

import { Role, TokenType, UserVerifyStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { USERS_MESSAGES } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import RefreshToken from "~/models/schemas/refresh-token.schemas";
import User from "~/models/schemas/user.schema";
import { generateOTP, hashPassword } from "~/utils/crypto";
import { readEmailTemplate } from "~/utils/email-templates";
import { signToken, verifyToken } from "~/utils/jwt";

import databaseService from "./database.services";
import walletService from "./wallets.services";
import { NextFunction, Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { sendPaginatedResponse } from "~/utils/pagination.helper";
import { getLocalTime } from "~/utils/date";

class UsersService {
  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
    });
  }

  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      options: { expiresIn: "15m" },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
    });
  }

  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      return signToken({
        payload: { user_id, token_type: TokenType.RefreshToken, verify, exp },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      });
    }
    else {
      return signToken({
        payload: { user_id, token_type: TokenType.RefreshToken, verify },
        options: { expiresIn: "7d" },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      });
    }
  }

  private signAccessAndRefreshTokens({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })]);
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshTokens({
      user_id,
      verify,
    });
    const { exp, iat } = await this.decodeRefreshToken(refresh_token);

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id),
        exp,
        iat,
      }),
    );
    return { access_token, refresh_token };
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email });
    return Boolean(user);
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId();
    const emailVerifyOtp = generateOTP();
    const localTime = getLocalTime();
    const emailVerifyOtpExpires = new Date(localTime.getTime() + 10 * 60 * 1000);

    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        fullname: payload.fullname,
        username: `user${user_id.toString()}`,
        email_verify_otp: emailVerifyOtp,
        email_verify_otp_expires: emailVerifyOtpExpires,
        password: hashPassword(payload.password),
        role: Role.User,
      }),
    );
    // create wallet for user
    await walletService.createWallet(user_id.toString());
    const [access_token, refresh_token] = await this.signAccessAndRefreshTokens({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified,
    });

    const { exp, iat } = await this.decodeRefreshToken(refresh_token);

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id),
        exp,
        iat,
      }),
    );
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_APP,
          pass: process.env.EMAIL_PASSWORD_APP,
        },
      });

      const htmlContent = readEmailTemplate("verify-otp.html", {
        fullname: payload.fullname,
        otp: emailVerifyOtp,
        expiryMinutes: "10"
      });

      const mailOptions = {
        from: `"MeBike" <${process.env.EMAIL_APP}>`,
        to: payload.email,
        subject: "Xác nhận đăng ký tài khoản MeBike",
        html: htmlContent,
      };

      transporter.sendMail(mailOptions);
      console.log("OTP verification email sent successfully to:", payload.email);
    }
    catch (error) {
      console.error("Error sending email:", error);
    }
    return { access_token, refresh_token };
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token });
    return { message: USERS_MESSAGES.LOGOUT_SUCCESS };
  }

  async forgotPassword({
    user_id,
    verify,
    email,
    fullname,
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    email: string;
    fullname: string;
  }) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    const forgotPasswordOtp = generateOTP();
    const forgotPasswordOtpExpires = new Date(localTime.getTime() + 5 * 60 * 1000);

    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_otp: forgotPasswordOtp,
          forgot_password_otp_expires: forgotPasswordOtpExpires,
          updated_at: localTime,
        },
      },
    );

    // mail
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_APP,
          pass: process.env.EMAIL_PASSWORD_APP,
        },
      });

      const htmlContent = readEmailTemplate("forgot-password-otp.html", {
        fullname,
        otp: forgotPasswordOtp,
        expiryMinutes: "5"
      });

      const mailOptions = {
        from: `"MeBike" <${process.env.EMAIL_APP}>`,
        to: email,
        subject: "[MeBike] Mã OTP đặt lại mật khẩu của bạn",
        html: htmlContent,
      };

      transporter.sendMail(mailOptions);
      console.log("Forgot password OTP email sent successfully to:", email);
    }
    catch (error) {
      console.error("Error sending forgot-password email:", error);
    }
    return { message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD };
  }

  async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(password),
          forgot_password_otp: null,
          forgot_password_otp_expires: null,
          updated_at: localTime,
        },
      },
    );
    return { message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS };
  }

  async verifyEmail(user_id: string) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, {
      $set: {
        verify: UserVerifyStatus.Verified,
        email_verify_otp: null,
        email_verify_otp_expires: null,
        updated_at: localTime,
      },
    });
    const [access_token, refresh_token] = await this.signAccessAndRefreshTokens({
      user_id,
      verify: UserVerifyStatus.Verified,
    });
    const { exp, iat } = await this.decodeRefreshToken(refresh_token);
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: refresh_token,
        user_id: new ObjectId(user_id),
        exp,
        iat,
      }),
    );
    return { access_token, refresh_token };
  }

  async resendEmailVerify(user_id: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }
    if (user.verify === UserVerifyStatus.Verified) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE,
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }
    if (user.verify === UserVerifyStatus.Banned) {
        throw new ErrorWithStatus({ 
          message: USERS_MESSAGES.USER_BANNED,
          status: HTTP_STATUS.FORBIDDEN
        });
    }
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    const emailVerifyOtp = generateOTP();
    const emailVerifyOtpExpires = new Date(localTime.getTime() + 10 * 60 * 1000);

    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, {
      $set: {
        email_verify_otp: emailVerifyOtp,
        email_verify_otp_expires: emailVerifyOtpExpires,
        updated_at: localTime,
      },
    });
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_APP,
          pass: process.env.EMAIL_PASSWORD_APP,
        },
      });
      const htmlContent = readEmailTemplate("verify-otp.html", {
        fullname: user.fullname,
        otp: emailVerifyOtp,
        expiryMinutes: "10"
      });

      const mailOptions = {
        from: `"MeBike" <${process.env.EMAIL_APP}>`,
        to: user.email,
        subject: "[MeBike] Mã OTP xác thực email mới của bạn",
        html: htmlContent,
      };

      transporter.sendMail(mailOptions);
      console.log("Resend OTP verification email sent successfully to:", user.email);
    }
    catch (error) {
      console.error("Error sending resend-verification email:", error);
    }
    return { message: USERS_MESSAGES.RESEND_EMAIL_VERIFY_SUCCESS };
  }

  async changePassword(user_id: string, password: string) {
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, {
      $set: {
        password: hashPassword(password),
        forgot_password_token: "",
        updated_at: localTime,
      },
    });
    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS,
    };
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
        },
      },
    );
    return user;
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const _payload = payload;
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);
    try {
      const user = await databaseService.users.findOneAndUpdate(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            ..._payload,
            updated_at: localTime,
          },
        },
        {
          returnDocument: "after",
          projection: {
            password: 0,
            email_verify_token: 0,
            forgot_password_token: 0,
          },
        },
      );
      return user;
    }
    catch (error) {
      console.error("Error updating user info:", error);
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.UPDATE_ME_ERROR,
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async refreshToken({
    user_id,
    verify,
    refresh_token,
    exp,
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    refresh_token: string;
    exp: number;
  }) {
    const [access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp }),
    ]);
    const { iat } = await this.decodeRefreshToken(refresh_token);
    await databaseService.refreshTokens.deleteOne({ token: refresh_token });
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: new_refresh_token, exp, iat }),
    );
    return { access_token, refresh_token: new_refresh_token };
  }

  async adminAndStaffGetAllUsers(
    req: Request<ParamsDictionary, any, any, AdminGetAllUsersReqQuery>,
    res: Response,
    next: NextFunction
  ) {
    const { fullname, verify, role } = req.query
    const query = req.query

    const filter: Filter<User> = {}

    if (fullname) {
      filter.fullname = { $regex: fullname, $options: 'i' }
    }

    if (verify) {
      filter.verify = verify
    }

    if(role) {
      filter.role = role as Role;
    }

    const projection = {
      password: 0,
      email_verify_otp: 0,
      email_verify_otp_expires: 0,
      forgot_password_otp: 0,
      forgot_password_otp_expires: 0
    }

    await sendPaginatedResponse(
      res,
      next,
      databaseService.users,
      query,
      filter,
      projection
    )
  }

  async searchUsers(query: string) {
    const regex = new RegExp(query, "i");

    const filter: Filter<User> = {
      $or: [
        { email: regex },
        { phone_number: regex },
      ],
    };

    const users = await databaseService.users
      .find(filter)
      .project({
        password: 0,
        email_verify_otp: 0,
        forgot_password_otp: 0,
      })
      .toArray();

    return users;
  }

  async getUserDetail(_id: string) {
    const user = await databaseService.users.findOne(
    { _id: new ObjectId(_id) },
    {
      projection: {
        password: 0,
        email_verify_otp: 0,
        forgot_password_otp: 0,
      },
    }
  );
    if (user == null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return user
  }

  async updateUserById(_id: string, payload: UpdateUserReqBody) {
    const localTime = getLocalTime()
    
    // Tạo object $set cơ bản
    const updatePayload: any = {
      ...payload,
      updated_at: localTime
    }

    //xử lý logic đặc biệt nếu email thay đổi
    if (payload.email) {
      const userToUpdate = await databaseService.users.findOne({ _id: new ObjectId(_id) })
      
      //chỉ kích hoạt nếu email mới khác email cũ
      if (userToUpdate && userToUpdate.email !== payload.email) {
        const emailVerifyOtp = generateOTP()
        const emailVerifyOtpExpires = new Date(localTime.getTime() + 10 * 60 * 1000)

        updatePayload.email = payload.email
        updatePayload.verify = UserVerifyStatus.Unverified //buộc user xác thực lại email mới
        updatePayload.email_verify_otp = emailVerifyOtp
        updatePayload.email_verify_otp_expires = emailVerifyOtpExpires

        //gửi email OTP đến địa chỉ email MỚI
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_APP,
              pass: process.env.EMAIL_PASSWORD_APP
            }
          })
          const htmlContent = readEmailTemplate('verify-otp.html', {
            fullname: payload.fullname || userToUpdate.fullname,
            otp: emailVerifyOtp,
            expiryMinutes: '10'
          })
          const mailOptions = {
            from: `"MeBike" <${process.env.EMAIL_APP}>`,
            to: payload.email,
            subject: '[MeBike] MÃ OTP XÁC THỰC EMAIL MỚI CỦA BẠN',
            html: htmlContent
          }
          transporter.sendMail(mailOptions)
        } catch (error) {
          console.error('Error sending re-verification email:', error)
        }
      }
    }
    
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(_id) },
      { $set: updatePayload },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_otp: 0,
          email_verify_otp_expires: 0,
          forgot_password_otp: 0,
          forgot_password_otp_expires: 0
        }
      }
    )

    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return user
  }

  async adminResetPassword(user_id: string, new_password: string) {
    const localTime = getLocalTime()

    const hashedPassword = hashPassword(new_password)

    //cập nhật mật khẩu mới và xóa các token reset cũ
    const result = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashedPassword,
          forgot_password_otp: null,
          forgot_password_otp_expires: null,
          updated_at: localTime
        }
      }
    )

    if (!result) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return result
  }
}

const usersService = new UsersService();
export default usersService;
