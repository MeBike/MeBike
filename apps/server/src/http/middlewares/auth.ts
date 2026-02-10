import { UnauthorizedErrorCodeSchema, unauthorizedErrorMessages } from "@mebike/shared";
import { Effect, Option } from "effect";
import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";

import type { AccessTokenPayload } from "@/domain/auth";
import type { RunPromise } from "@/http/shared/runtime";

import { requireJwtSecret } from "@/domain/auth";
import { UserServiceTag } from "@/domain/users";

const unauthorizedBody = {
  error: unauthorizedErrorMessages.UNAUTHORIZED,
  details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
} as const;

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

async function loadUser(runPromise: RunPromise, userId: string) {
  return await runPromise(Effect.gen(function* () {
    const service = yield* UserServiceTag;
    return yield* service.getById(userId);
  }));
}

export const currentUserMiddleware = createMiddleware(async (c, next) => {
  const token = parseBearerToken(c.req.header("Authorization"));
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      const userOpt = await loadUser(c.var.runPromise, payload.userId);
      if (Option.isNone(userOpt) || userOpt.value.verify === "BANNED") {
        c.set("authFailure", "forbidden");
      }
      else {
        const user = userOpt.value;
        const role = user.role === "SOS" ? "USER" : user.role;
        c.set("currentUser", {
          userId: user.id,
          role,
          verifyStatus: user.verify,
          tokenType: "access",
        });
      }
    }
  }
  await next();
});

export const requireAuthMiddleware = createMiddleware(async (c, next) => {
  const user = c.var.currentUser;
  if (!user) {
    if (c.var.authFailure === "forbidden") {
      return c.json(unauthorizedBody, 403);
    }
    return c.json(unauthorizedBody, 401);
  }
  await next();
});

export const requireAdminMiddleware = createMiddleware(async (c, next) => {
  const user = c.var.currentUser;
  if (!user) {
    if (c.var.authFailure === "forbidden") {
      return c.json(unauthorizedBody, 403);
    }
    return c.json(unauthorizedBody, 401);
  }
  if (user.role !== "ADMIN") {
    return c.json(unauthorizedBody, 403);
  }
  await next();
});

export const requireAdminOrStaffMiddleware = createMiddleware(async (c, next) => {
  const user = c.var.currentUser;
  if (!user) {
    if (c.var.authFailure === "forbidden") {
      return c.json(unauthorizedBody, 403);
    }
    return c.json(unauthorizedBody, 401);
  }
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    return c.json(unauthorizedBody, 403);
  }
  await next();
});
