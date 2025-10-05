import type { JwtPayload } from "jsonwebtoken";

import type { TokenType, UserVerifyStatus } from "~/constants/enums";

export type TokenPayLoad = {
  user_id: string;
  token_type: TokenType;
  verify: UserVerifyStatus;
  exp: number;
  iat: number;
} & JwtPayload;

export type LoginReqBody = {
  email: string;
  password: string;
};

export type RegisterReqBody = {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  avatar?: string;
};

export type LogoutReqBody = {
  refresh_token: string;
};

export type resetPasswordReqBody = {
  forgot_password_token: string;
  password: string;
  confirm_password: string;
};

export type VerifyEmailReqBody = {
  email_verify_token: string;
};

export type ChangePasswordReqBody = {
  old_password: string;
  password: string;
  confirm_password: string;
};

export type UpdateMeReqBody = {
  fullname?: string;
  location?: string;
  username?: string;
  avatar?: string;
};
