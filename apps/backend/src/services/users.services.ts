import { Filter, ObjectId } from "mongodb";
import process from "node:process";
import nodemailer from 'nodemailer'

import type { AdminCreateUserReqBody, AdminGetAllUsersReqQuery, RegisterReqBody, UpdateMeReqBody, UpdateUserReqBody } from "~/models/requests/users.requests";

import { RentalStatus, Role, TokenType, UserVerifyStatus } from "~/constants/enums";
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
import { getLocalTime } from "~/utils/date-time";

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

    // await databaseService.users.insertOne(
    //   new User({
    //     ...payload,
    //     _id: user_id,
    //     fullname: payload.fullname,
    //     username: `user${user_id.toString()}`,
    //     email_verify_otp: emailVerifyOtp,
    //     email_verify_otp_expires: emailVerifyOtpExpires,
    //     password: hashPassword(payload.password),
    //     role: Role.User,
    //   }),
    // );

    // create wallet for user
    // await walletService.createWallet(user_id.toString());

    //dữ liệu của user
    const newUser = new User({
      ...payload,
      _id: user_id,
      fullname: payload.fullname,
      username: `user${user_id.toString()}`,
      email_verify_otp: emailVerifyOtp,
      email_verify_otp_expires: emailVerifyOtpExpires,
      password: hashPassword(payload.password),
      role: Role.User
    })

    const [access_token, refresh_token] = await this.signAccessAndRefreshTokens({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified,
    });

    const { exp, iat } = await this.decodeRefreshToken(refresh_token);

    // await databaseService.refreshTokens.insertOne(
    //   new RefreshToken({
    //     token: refresh_token,
    //     user_id: new ObjectId(user_id),
    //     exp,
    //     iat,
    //   }),
    // );
    // dữ liệu của refresh token
    const newRefreshToken = new RefreshToken({
      token: refresh_token,
      user_id: new ObjectId(user_id),
      exp,
      iat
    })

    //khởi tạo session
    const session = databaseService.getClient().startSession()

    try {
      //bắt đầu transaction
      await session.withTransaction(async () => {
        //tất cả các lệnh ghi database PHẢI được await bên trong này
        //và phải truyền `{ session }`
        
        //ghi vào users
        await databaseService.users.insertOne(newUser, { session })
        
        //ghi vào wallets (sử dụng hàm createWallet)
        await walletService.createWallet(user_id.toString(), session)
        
        //ghi vào refreshTokens
        await databaseService.refreshTokens.insertOne(newRefreshToken, { session })
      })
      //nếu transaction thành công, tiếp tục gửi email
    } catch (error) {
      //nếu transaction thất bại
      // `users.insertOne` và `refreshTokens.insertOne` sẽ tự động được rollback.
      throw error //ném lỗi ra controller
    } finally {
      //luôn đóng session
      await session.endSession()
    }

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

  async getUserStats() {
    //$facet chạy nhiều pipeline đếm song song
    const statsPipeline = [
      {
        $facet: {
          //pipeline 1: Đếm tổng số người dùng
          "total_users": [
            { $count: "count" }
          ],
          //pipeline 2: Đếm số người dùng đã xác thực
          "total_verified": [
            { $match: { verify: UserVerifyStatus.Verified } },
            { $count: "count" }
          ],
          //pipeline 3: Đếm số người dùng chưa xác thực
          "total_unverified": [
            { $match: { verify: UserVerifyStatus.Unverified } },
            { $count: "count" }
          ],
          //pipeline 4: Đếm số người dùng bị cấm
          "total_banned": [
            { $match: { verify: UserVerifyStatus.Banned } },
            { $count: "count" }
          ]
        }
      },
      {
        //làm sạch output
        $project: {
          // $arrayElemAt lấy phần tử đầu tiên của mảng (hoặc null)
          // $ifNull xử lý trường hợp mảng rỗng (không có user nào) và trả về 0
          "total_users": { $ifNull: [{ $arrayElemAt: ["$total_users.count", 0] }, 0] },
          "total_verified": { $ifNull: [{ $arrayElemAt: ["$total_verified.count", 0] }, 0] },
          "total_unverified": { $ifNull: [{ $arrayElemAt: ["$total_unverified.count", 0] }, 0] },
          "total_banned": { $ifNull: [{ $arrayElemAt: ["$total_banned.count", 0] }, 0] }
        }
      }
    ];

    //chạy pipeline
    const result = await databaseService.users.aggregate(statsPipeline).toArray();

    //$facet luôn trả về một mảng chứa 1 document, kể cả khi collection rỗng
    return result[0];
  }

  async getActiveUserTimeseries(groupBy: 'day' | 'month', startDate: string, endDate: string) {
    const start = new Date(startDate)
    //thêm 1 ngày vào endDate để bao gồm cả ngày đó
    const end = new Date(endDate)
    end.setDate(end.getDate() + 1)

    //xác định định dạng group theo ngày hay tháng
    const dateFormat = groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m'

    const pipeline = [
      {
        //lọc các refresh token được tạo trong khoảng thời gian
        $match: {
          iat: { // 'iat' (issued at) là trường Date trong schema RefreshToken
            $gte: start,
            $lt: end
          }
        }
      },
      {
        //nhóm theo (ngày/tháng) VÀ user_id để lấy user duy nhất mỗi kỳ
        $group: {
          _id: {
            date: {
              $dateToString: { format: dateFormat, date: '$iat', timezone: 'Asia/Ho_Chi_Minh' }
            },
            user_id: '$user_id'
          }
        }
      },
      {
        //nhóm lại một lần nữa chỉ theo ngày/tháng để đếm số user duy nhất
        $group: {
          _id: '$_id.date',
          active_users_count: { $sum: 1 }
        }
      },
      {
        //định dạng lại output
        $project: {
          _id: 0,
          date: '$_id',
          active_users_count: 1
        }
      },
      {
        //sắp xếp theo ngày
        $sort: {
          date: 1
        }
      }
    ]

    const result = await databaseService.refreshTokens.aggregate(pipeline).toArray()
    return result
  }

  async getTopRentersStats(page: number, limit: number) {
    //tính skip và limit cho pipeline
    const skip = (page - 1) * limit

    const pipeline = [
      {
        //chỉ lọc các chuyến đi đã "Hoàn thành"
        $match: {
          status: RentalStatus.Completed
        }
      },
      {
        //nhóm theo user_id và đếm số chuyến
        $group: {
          _id: '$user_id',
          total_rentals: { $sum: 1 }
        }
      },
      {
        //sắp xếp: người thuê nhiều nhất lên đầu
        $sort: {
          total_rentals: -1
        }
      },
      {
        //phân trang
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        //join với collection 'users' để lấy thông tin chi tiết
        $lookup: {
          from: 'users', //tên collection 'users'
          localField: '_id', //user_id từ collection 'rentals'
          foreignField: '_id', //_id từ collection 'users'
          as: 'user_info'
        }
      },
      {
        // $lookup trả về 1 mảng, ta $unwind để lấy object
        $unwind: '$user_info'
      },
      {
        //định dạng lại output
        $project: {
          _id: 0,
          total_rentals: 1,
          user: {
            _id: '$user_info._id',
            fullname: '$user_info.fullname',
            email: '$user_info.email',
            phone_number: '$user_info.phone_number',
            avatar: '$user_info.avatar',
            location: '$user_info.location'
          }
        }
      }
    ]

    // Pipeline để đếm tổng số user đã từng thuê (cho phân trang)
    const countPipeline = [
      { $match: { status: RentalStatus.Completed } },
      { $group: { _id: '$user_id' } },
      { $count: 'total_records' }
    ]

    const [results, countResult] = await Promise.all([
      databaseService.rentals.aggregate(pipeline).toArray(),
      databaseService.rentals.aggregate(countPipeline).toArray()
    ])

    const total_records = countResult[0]?.total_records || 0
    const total_pages = Math.ceil(total_records / limit)

    return {
      data: results,
      pagination: {
        page,
        limit,
        total_pages,
        total_records
      }
    }
  }

  async adminCreateUser(payload: AdminCreateUserReqBody) {
    const user_id = new ObjectId()
    const localTime = getLocalTime()

    const newUser = new User({
      ...payload,
      _id: user_id,
      username: `user${user_id.toString()}`,
      password: hashPassword(payload.password),
      role: payload.role,
      verify: payload.verify || UserVerifyStatus.Verified, //mặc định là Verified
      email_verify_otp: null,
      email_verify_otp_expires: null,
      forgot_password_otp: null,
      forgot_password_otp_expires: null,
      created_at: localTime,
      updated_at: localTime
    })

    const session = databaseService.getClient().startSession()

    try {
      await session.withTransaction(async () => {
        await databaseService.users.insertOne(newUser, { session })
        
        await walletService.createWallet(user_id.toString(), session)
      })

      //lấy lại user vừa tạo (để bỏ password)
      const createdUser = await this.getMe(user_id.toString())
      return createdUser

    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }
  }

  async getNewUserStats() {
    const now = getLocalTime() //ví dụ: 2025-10-24)

    //xác định các khoảng thời gian
    //Month-to-Date (MTD) cho tháng này
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1) // 2025-10-01
    const endOfThisMonth = now // 2025-10-24 lúc này là lúc mình làm API này

    //Month-to-Date (MTD) cho tháng trước (để so sánh)
    //case này mình làm để tránh có tháng trước không có ngày tương ứng (ví dụ: tháng 2 không có ngày 30,31)
    //nên ta sẽ lấy ngày bắt đầu là ngày 1 của tháng trước
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1) // 2025-09-01

    //lấy ngày cuối cùng của tháng trước
    //new Date(year, month, 0) sẽ trả về ngày cuối cùng của tháng TRƯỚC ĐÓ
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate() //(Vd: Tháng 10, new Date(2025, 9, 0) là 30/09 -> 30)

    //lấy ngày hiện tại
    const currentDayOfMonth = now.getDate() // (Vd: 24)

    //so sánh: Lấy ngày nhỏ hơn.
    // Vd 1: (Hôm nay 31/03) Math.min(28, 31) -> 28 (Đúng, lấy 28/02)
    // Vd 2: (Hôm nay 30/09) Math.min(31, 30) -> 30 (Đúng, lấy 30/08)
    // Vd 3: (Hôm nay 24/10) Math.min(30, 24) -> 24 (Đúng, lấy 24/09)
    const correctDayForLastMonth = Math.min(lastDayOfLastMonth, currentDayOfMonth)

    //ngày kết thúc của tháng trước
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, correctDayForLastMonth) // (Vd: 2025-09-24)
    
    //tạo Aggregation Pipeline
    const statsPipeline = [
      {
        $facet: {
          "thisMonth": [
            { 
              $match: { 
                role: Role.User,
                created_at: { $gte: startOfThisMonth, $lte: endOfThisMonth } 
              } 
            },
            { $count: "count" }
          ],
          "lastMonth": [
            { 
              $match: { 
                role: Role.User,
                created_at: { $gte: startOfLastMonth, $lte: endOfLastMonth } //dùng ngày kết thúc đã sửa
              } 
            },
            { $count: "count" }
          ]
        }
      },
      {
        //định dạng output
        $project: {
          "newUsersThisMonth": { $ifNull: [{ $arrayElemAt: ["$thisMonth.count", 0] }, 0] },
          "newUsersLastMonth": { $ifNull: [{ $arrayElemAt: ["$lastMonth.count", 0] }, 0] }
        }
      }
    ]

    //chạy pipeline
    const result = await databaseService.users.aggregate(statsPipeline).toArray()
    const counts = result[0] || { newUsersThisMonth: 0, newUsersLastMonth: 0 }

    //tính toán phần trăm thay đổi
    const { newUsersThisMonth, newUsersLastMonth } = counts
    let percentageChange: number = 0.0

    if (newUsersLastMonth === 0) {
      percentageChange = (newUsersThisMonth > 0) ? 100.0 : 0.0
    } else {
      percentageChange = ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
    }

    return {
      newUsersThisMonth: newUsersThisMonth,
      newUsersLastMonth: newUsersLastMonth,
      percentageChange: parseFloat(percentageChange.toFixed(2))
    }
  }

  async getAdminUserDashboardStats() {
    const now = getLocalTime()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const statsPipeline = [
      {
        $facet: {
          //tổng khách hàng
          totalCustomers: [
            { $match: { role: Role.User } },
            { $count: 'count' }
          ],
          //khách hàng đang hoạt động(verified)
          activeCustomers: [
            { $match: { role: Role.User, verify: UserVerifyStatus.Verified } },
            { $count: 'count' }
          ],
          //khách hàng mới trong tháng
          newCustomersThisMonth: [
            {
              $match: {
                role: Role.User,
                created_at: { $gte: startOfMonth, $lte: endOfMonth }
              }
            },
            { $count: 'count' }
          ]
        }
      },
      {
        $project: {
          totalCustomers: { $ifNull: [{ $arrayElemAt: ['$totalCustomers.count', 0] }, 0] },
          activeCustomers: { $ifNull: [{ $arrayElemAt: ['$activeCustomers.count', 0] }, 0] },
          newCustomersThisMonth: { $ifNull: [{ $arrayElemAt: ['$newCustomersThisMonth.count', 0] }, 0] }
        }
      }
    ]

    const vipCustomerPipeline = [
      //lọc các chuyến đi đã hoàn thành
      { $match: { status: RentalStatus.Completed } },
      //nhóm theo user và tính tổng thời gian thuê
      {
        $group: {
          _id: '$user_id',
          totalDuration: { $sum: '$duration' }
        }
      },
      //sắp xếp để tìm người có thời gian thuê cao nhất
      { $sort: { totalDuration: -1 } },
      //lấy top 1
      { $limit: 1 },
      //join với collection 'users' để lấy tên
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      //định dạng output
      {
        $project: {
          _id: 0,
          fullname: '$userInfo.fullname',
          totalDuration: 1
        }
      }
    ]

    const revenuePipeline = [
      { $match: { status: RentalStatus.Completed } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $toDouble: '$total_price' } }
        }
      }
    ]

    const [statsResult, vipResult, revenueResult] = await Promise.all([
      databaseService.users.aggregate(statsPipeline).toArray(),
      databaseService.rentals.aggregate(vipCustomerPipeline).toArray(),
      databaseService.rentals.aggregate(revenuePipeline).toArray()
    ])

    const stats = statsResult[0] || { totalCustomers: 0, activeCustomers: 0, newCustomersThisMonth: 0 }
    const vipCustomer = vipResult[0] || null
    const totalRevenue = revenueResult[0]?.totalRevenue || 0
    const averageSpending = stats.totalCustomers > 0 ? totalRevenue / stats.totalCustomers : 0

    return { ...stats, vipCustomer, totalRevenue, averageSpending: parseFloat(averageSpending.toFixed(2)) }
  }
}

const usersService = new UsersService();
export default usersService;
