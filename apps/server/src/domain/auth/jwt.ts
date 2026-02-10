import jwt from "jsonwebtoken";

import type { UserRow } from "@/domain/users";

import { env } from "@/config/env";

import type { UserRole, UserVerifyStatus } from "../../../generated/prisma/enums";
import type { AccessTokenPayload, RefreshSession, RefreshTokenPayload } from "./models";

import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_TTL_MS,
} from "./config";

function clampRole(role: UserRole): AccessTokenPayload["role"] {
  return role === "SOS" ? "USER" : (role as AccessTokenPayload["role"]);
}

export const requireJwtSecret = (): string => env.JWT_SECRET;

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export function makeTokensForUser(user: UserRow, sessionId: string): Tokens {
  const secret = requireJwtSecret();
  const accessPayload: AccessTokenPayload = {
    userId: user.id,
    role: clampRole(user.role),
    verifyStatus: user.verify as UserVerifyStatus,
    tokenType: "access",
  };
  const refreshPayload: RefreshTokenPayload = {
    userId: user.id,
    verifyStatus: user.verify as UserVerifyStatus,
    tokenType: "refresh",
    jti: sessionId,
  };

  return {
    accessToken: jwt.sign(accessPayload, secret, {
      algorithm: "HS256",
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    }),
    refreshToken: jwt.sign(refreshPayload, secret, {
      algorithm: "HS256",
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    }),
  };
}

export function makeSessionFromRefreshToken(userId: string, refreshToken: string, sessionId: string): RefreshSession {
  const decoded = jwt.decode(refreshToken) as jwt.JwtPayload | null;
  const expiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  const issuedAt = decoded?.iat ? new Date(decoded.iat * 1000) : new Date();

  return {
    sessionId,
    userId,
    refreshToken,
    issuedAt,
    expiresAt,
  };
}
