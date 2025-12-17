import { serverRoutes, UnauthorizedErrorCodeSchema, unauthorizedErrorMessages, UsersContracts } from "@mebike/shared";
import { Effect, Match } from "effect";

import { withLoggedCause } from "@/domain/shared";
import {
  getUserByIdUseCase,
  updateProfileUseCase,
} from "@/domain/users";
import { withUserDeps } from "@/http/shared/providers";

function pickDefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export function registerUserRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const users = serverRoutes.users;

  app.openapi(users.me, async (c) => {
    const userId = c.var.currentUser?.userId;
    if (!userId) {
      return c.json({
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      }, 401);
    }

    const eff = withLoggedCause(withUserDeps(getUserByIdUseCase(userId)), "GET /v1/users/me");
    const result = await Effect.runPromise(eff);

    if (result._tag === "Some") {
      return c.json<UsersContracts.MeResponse, 200>(
        { data: mapUserDetail(result.value) },
        200,
      );
    }

    return c.json<UsersContracts.UserErrorResponse, 404>({
      error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
      details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
    }, 404);
  });

  app.openapi(users.updateMe, async (c) => {
    const userId = c.var.currentUser?.userId;
    if (!userId) {
      return c.json({
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      }, 401);
    }

    const body = c.req.valid("json");
    const eff = withLoggedCause(
      withUserDeps(updateProfileUseCase({
        userId,
        patch: pickDefined(body),
      })),
      "PATCH /v1/users/me",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) => {
        if (right._tag === "Some") {
          return c.json<UsersContracts.UpdateMeResponse, 200>(
            { data: mapUserDetail(right.value) },
            200,
          );
        }
        return c.json<UsersContracts.UserErrorResponse, 404>({
          error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
        }, 404);
      }),
      Match.tag("Left", ({ left }) => Match.value(left).pipe(
        Match.tag("DuplicateUserEmail", () => c.json<UsersContracts.UserErrorResponse, 409>({
          error: UsersContracts.userErrorMessages.DUPLICATE_EMAIL,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.DUPLICATE_EMAIL },
        }, 409)),
        Match.tag("DuplicateUserPhoneNumber", () => c.json<UsersContracts.UserErrorResponse, 409>({
          error: UsersContracts.userErrorMessages.DUPLICATE_PHONE_NUMBER,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.DUPLICATE_PHONE_NUMBER },
        }, 409)),
        Match.orElse(() => c.json<UsersContracts.UserErrorResponse, 404>({
          error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
        }, 404)),
      )),
      Match.exhaustive,
    );
  });
}

function mapUserDetail(row: import("@/domain/users").UserRow): UsersContracts.UserDetail {
  return {
    id: row.id,
    fullname: row.fullname,
    email: row.email,
    verify: row.verify,
    location: row.location ?? "",
    username: row.username ?? "",
    phoneNumber: row.phoneNumber ?? "",
    avatar: row.avatar ?? "",
    role: row.role,
    nfcCardUid: row.nfcCardUid ?? "",
    updatedAt: row.updatedAt.toISOString(),
  };
}
