import { ObjectId } from "mongodb";
import process from "node:process";
import nodemailer from "nodemailer";

import type { RegisterReqBody } from "~/models/requests/users.requests";

import { Role, TokenType, UserVerifyStatus } from "~/constants/enums";
import HTTP_STATUS from "~/constants/http-status";
import { USERS_MESSAGES } from "~/constants/messages";
import { ErrorWithStatus } from "~/models/errors";
import RefreshToken from "~/models/schemas/refresh-token.schemas";
import User from "~/models/schemas/user.schema";
import { hashPassword } from "~/utils/crypto";
import { readEmailTemplate } from "~/utils/email-templates";
import { signToken, verifyToken } from "~/utils/jwt";

import databaseService from "./database.services";

class UsersService {
  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
    });
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerificationToken, verify },
      options: { expiresIn: "1d" },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
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

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPasswordToken, verify },
      options: { expiresIn: "1d" },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
    });
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
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified,
    });
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        fullname: payload.full_name,
        username: `user${user_id.toString()}`,
        email_verify_token,
        password: hashPassword(payload.password),
        role: Role.User,
      }),
    );
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

      const verifyURL = `${process.env.FRONTEND_URL}/auth/verify-email?email_verify_token=${email_verify_token}`; // Đường dẫn xác nhận email

      const htmlContent = readEmailTemplate("verify-email.html", {
        full_name: payload.full_name,
        verifyURL,
      });

      const mailOptions = {
        from: `"MeBike" <${process.env.EMAIL_APP}>`,
        to: payload.email,
        subject: "Xác nhận đăng ký tài khoản MeBike",
        html: htmlContent, // truyền nội dung html vào
      };

      transporter.sendMail(mailOptions);
      console.log("Email verification sent successfully to:", payload.email);
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
    const forgot_password_token = await this.signForgotPasswordToken({
      user_id,
      verify,
    });
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token,
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

      // const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${forgot_password_token}`
      const resetURL = `${process.env.FRONTEND_URL}/auth/reset-password?token=${forgot_password_token}`;

      const htmlContent = readEmailTemplate("forgot-password.html", {
        fullname,
        resetURL,
      });

      const mailOptions = {
        from: `"MeBike" <${process.env.EMAIL_APP}>`,
        to: email,
        subject: "Yêu cầu đặt lại mật khẩu cho tài khoản MeBike",
        html: htmlContent,
      };

      transporter.sendMail(mailOptions);
      console.log("Forgot password email sent successfully to:", email);
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
          forgot_password_token: "",
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
        email_verify_token: "",
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
    const email_verify_token = await this.signEmailVerifyToken({
      user_id,
      verify: UserVerifyStatus.Unverified,
    });
    const currentDate = new Date();
    const vietnamTimezoneOffset = 7 * 60;
    const localTime = new Date(currentDate.getTime() + vietnamTimezoneOffset * 60 * 1000);

    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, {
      $set: {
        email_verify_token,
        updated_at: localTime,
      },
    });
    // mail
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_APP,
          pass: process.env.EMAIL_PASSWORD_APP,
        },
      });
      const verifyURL = `${process.env.FRONTEND_URL}/auth/verify-email?email_verify_token=${email_verify_token}`;

      // Sử dụng template 'resend-verify-email.html'
      const htmlContent = readEmailTemplate("resend-verify-email.html", {
        fullname: user.fullname, // Truyền tên người dùng vào template
        verifyURL,
      });

      const mailOptions = {
        from: `"MeBike" <${process.env.EMAIL_APP}>`,
        to: user.email, // Gửi đến email của người dùng
        subject: "Yêu cầu gửi lại email xác thực tài khoản MeBike",
        html: htmlContent,
      };

      transporter.sendMail(mailOptions);
      console.log("Resend verification email sent successfully to:", user.email);
    }
    catch (error) {
      console.error("Error sending resend-verification email:", error);
    }
    return { message: USERS_MESSAGES.RESEND_EMAIL_VERIFY_SUCCESS };
  }
}

const usersService = new UsersService();
export default usersService;
