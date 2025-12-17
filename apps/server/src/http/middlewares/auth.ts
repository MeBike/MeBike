import { UnauthorizedErrorCodeSchema, unauthorizedErrorMessages } from "@mebike/shared";
import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";

import type { AccessTokenPayload } from "@/domain/auth";

import { requireJwtSecret } from "@/domain/auth";

const unauthorizedBody = {
  error: unauthorizedErrorMessages.UNAUTHORIZED,
  details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
} as const;

export type AuthEnv = {
  Variables: {
    currentUser?: AccessTokenPayload;
  };
};

function parseBearerToken(header: string | null | undefined): string | null {
  if (!header)
    return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || !token)
    return null;
  if (scheme.toLowerCase() !== "bearer")
    return null;
  return token;
}

function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = jwt.verify(token, requireJwtSecret()) as AccessTokenPayload & jwt.JwtPayload;
    if (payload.tokenType !== "access")
      return null;
    return payload;
  }
  catch {
    return null;
  }
}

export const currentUserMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const token = parseBearerToken(c.req.header("Authorization"));
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      c.set("currentUser", payload);
    }
  }
  await next();
});

export const requireAuthMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const user = c.var.currentUser;
  if (!user) {
    return c.json(unauthorizedBody, 401);
  }
  await next();
});
