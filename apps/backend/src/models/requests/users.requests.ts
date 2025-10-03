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
