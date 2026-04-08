import type { Context } from "hono";

import {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
} from "@mebike/shared";
import { Effect, Option } from "effect";
import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";

import type { AccessTokenPayload } from "@/domain/auth";
import type { RunPromise } from "@/http/shared/runtime";

import { hasActiveAgencyAccess, requireJwtSecret } from "@/domain/auth";
import { UserQueryServiceTag } from "@/domain/users";

type Role = AccessTokenPayload["role"];

const unauthorizedBody = {
  error: unauthorizedErrorMessages.UNAUTHORIZED,
  details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
} as const;

function rejectUnauthorized(c: Context) {
  if (c.var.authFailure === "forbidden") {
    return c.json(unauthorizedBody, 403);
  }
  return c.json(unauthorizedBody, 401);
}

function requireRoles(...allowedRoles: readonly Role[]) {
  return createMiddleware(async (c, next) => {
    const user = c.var.currentUser;
    if (!user) {
      return rejectUnauthorized(c);
    }
    if (!allowedRoles.includes(user.role)) {
      return c.json(unauthorizedBody, 403);
    }
    await next();
  });
}

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
    const payload = jwt.verify(
      token,
      requireJwtSecret(),
    ) as AccessTokenPayload & jwt.JwtPayload;
    if (payload.tokenType !== "access")
      return null;
    return payload;
  }
  catch {
    return null;
  }
}

async function loadUser(runPromise: RunPromise, userId: string) {
  return await runPromise(
    Effect.gen(function* () {
      const service = yield* UserQueryServiceTag;
      return yield* service.getById(userId);
    }),
  );
}

export const currentUserMiddleware = createMiddleware(async (c, next) => {
  const token = parseBearerToken(c.req.header("Authorization"));
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      const userOpt = await loadUser(c.var.runPromise, payload.userId);
      if (
        Option.isNone(userOpt)
        || userOpt.value.accountStatus === "BANNED"
        || !hasActiveAgencyAccess(userOpt.value)
      ) {
        c.set("authFailure", "forbidden");
      }
      else {
        const user = userOpt.value;
        const operatorStationId = user.orgAssignment?.station?.id
          ?? user.orgAssignment?.agency?.stationId
          ?? undefined;

        c.set("currentUser", {
          userId: user.id,
          role: user.role,
          accountStatus: user.accountStatus,
          verifyStatus: user.verify,
          agencyId: user.orgAssignment?.agency?.id ?? undefined,
          operatorStationId,
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
    return rejectUnauthorized(c);
  }
  await next();
});

export const requireAdminMiddleware = requireRoles("ADMIN");
export const requireAgencyMiddleware = requireRoles("AGENCY");
export const requireStaffMiddleware = requireRoles("STAFF");
export const requireUserMiddleware = requireRoles("USER");
export const requireTechnicianMiddleware = requireRoles("TECHNICIAN");
export const requireBackofficeMiddleware = requireRoles("ADMIN", "STAFF");
export const requireRentalOperatorMiddleware = requireRoles("STAFF", "AGENCY");
export const requireRentalSupportMiddleware = requireRoles(
  "ADMIN",
  "STAFF",
  "AGENCY",
);
export const requireIncidentViewerMiddleware = requireRoles(
  "TECHNICIAN",
  "ADMIN",
  "USER",
);
export const requireIncidentActorMiddleware = requireRoles(
  "TECHNICIAN",
  "ADMIN",
  "USER",
  "STAFF",
);
