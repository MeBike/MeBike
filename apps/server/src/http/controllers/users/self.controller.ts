import type { RouteHandler } from "@hono/zod-openapi";

import {
  serverRoutes,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UsersContracts,
} from "@mebike/shared";
import { Effect, Match } from "effect";

import { withLoggedCause } from "@/domain/shared";
import {
  AvatarUploadServiceTag,
  UserCommandServiceTag,
  UserQueryServiceTag,
} from "@/domain/users";
import { routeContext } from "@/http/shared/route-context";

import { mapUserDetail, pickDefined } from "./shared";

type UsersRoutes = typeof import("@mebike/shared")["serverRoutes"]["users"];
const users = serverRoutes.users;

function pickAvatarFile(value: string | File | Array<string | File> | undefined) {
  if (value instanceof File) {
    return value;
  }

  if (Array.isArray(value)) {
    const file = value.find(entry => entry instanceof File);
    return file ?? null;
  }

  return null;
}

const me: RouteHandler<UsersRoutes["me"]> = async (c) => {
  const userId = c.var.currentUser?.userId;
  if (!userId) {
    return c.json(
      {
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      },
      401,
    );
  }

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* UserQueryServiceTag;
      return yield* service.getById(userId);
    }),
    routeContext(users.me),
  );
  const result = await c.var.runPromise(eff);

  if (result._tag === "Some") {
    return c.json<UsersContracts.MeResponse, 200>(mapUserDetail(result.value), 200);
  }

  return c.json<UsersContracts.UserErrorResponse, 404>(
    {
      error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
      details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
    },
    404,
  );
};

const updateMe: RouteHandler<UsersRoutes["updateMe"]> = async (c) => {
  const userId = c.var.currentUser?.userId;
  if (!userId) {
    return c.json(
      {
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      },
      401,
    );
  }

  const body = c.req.valid("json");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* UserCommandServiceTag;
      return yield* service.updateProfile(userId, pickDefined(body));
    }),
    routeContext(users.updateMe),
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      if (right._tag === "Some") {
        return c.json<UsersContracts.UpdateMeResponse, 200>(mapUserDetail(right.value), 200);
      }
      return c.json<UsersContracts.UserErrorResponse, 404>(
        {
          error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
        },
        404,
      );
    }),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("DuplicateUserEmail", () =>
          c.json<UsersContracts.UserErrorResponse, 409>(
            {
              error: UsersContracts.userErrorMessages.DUPLICATE_EMAIL,
              details: { code: UsersContracts.UserErrorCodeSchema.enum.DUPLICATE_EMAIL },
            },
            409,
          )),
        Match.tag("DuplicateUserPhoneNumber", () =>
          c.json<UsersContracts.UserErrorResponse, 409>(
            {
              error: UsersContracts.userErrorMessages.DUPLICATE_PHONE_NUMBER,
              details: {
                code: UsersContracts.UserErrorCodeSchema.enum.DUPLICATE_PHONE_NUMBER,
              },
            },
            409,
          )),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

const uploadMyAvatar: RouteHandler<UsersRoutes["uploadMyAvatar"]> = async (c) => {
  const userId = c.var.currentUser?.userId;
  if (!userId) {
    return c.json(
      {
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      },
      401,
    );
  }

  const form = await c.req.parseBody();
  const avatarFile = pickAvatarFile(form.avatar);

  if (!avatarFile) {
    return c.json<UsersContracts.UserErrorResponse, 400>(
      {
        error: UsersContracts.userErrorMessages.INVALID_AVATAR_IMAGE,
        details: { code: UsersContracts.UserErrorCodeSchema.enum.INVALID_AVATAR_IMAGE },
      },
      400,
    );
  }

  const bytes = new Uint8Array(await avatarFile.arrayBuffer());
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* AvatarUploadServiceTag;
      return yield* service.uploadForUser({
        userId,
        bytes,
        originalFilename: avatarFile.name,
      });
    }),
    routeContext(users.uploadMyAvatar),
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      if (right._tag === "Some") {
        return c.json<UsersContracts.UpdateMeResponse, 200>(mapUserDetail(right.value), 200);
      }

      return c.json<UsersContracts.UserErrorResponse, 404>(
        {
          error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
        },
        404,
      );
    }),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("AvatarImageTooLarge", () =>
          c.json<UsersContracts.UserErrorResponse, 400>(
            {
              error: UsersContracts.userErrorMessages.AVATAR_IMAGE_TOO_LARGE,
              details: { code: UsersContracts.UserErrorCodeSchema.enum.AVATAR_IMAGE_TOO_LARGE },
            },
            400,
          )),
        Match.tag("AvatarImageUnsupportedType", () =>
          c.json<UsersContracts.UserErrorResponse, 400>(
            {
              error: UsersContracts.userErrorMessages.INVALID_AVATAR_IMAGE,
              details: { code: UsersContracts.UserErrorCodeSchema.enum.INVALID_AVATAR_IMAGE },
            },
            400,
          )),
        Match.tag("AvatarImageInvalid", () =>
          c.json<UsersContracts.UserErrorResponse, 400>(
            {
              error: UsersContracts.userErrorMessages.INVALID_AVATAR_IMAGE,
              details: { code: UsersContracts.UserErrorCodeSchema.enum.INVALID_AVATAR_IMAGE },
            },
            400,
          )),
        Match.tag("AvatarImageDimensionsExceeded", () =>
          c.json<UsersContracts.UserErrorResponse, 400>(
            {
              error: UsersContracts.userErrorMessages.AVATAR_IMAGE_DIMENSIONS_TOO_LARGE,
              details: {
                code: UsersContracts.UserErrorCodeSchema.enum.AVATAR_IMAGE_DIMENSIONS_TOO_LARGE,
              },
            },
            400,
          )),
        Match.tag("FirebaseStorageInitError", () =>
          c.json<UsersContracts.UserErrorResponse, 503>(
            {
              error: UsersContracts.userErrorMessages.AVATAR_UPLOAD_UNAVAILABLE,
              details: { code: UsersContracts.UserErrorCodeSchema.enum.AVATAR_UPLOAD_UNAVAILABLE },
            },
            503,
          )),
        Match.tag("FirebaseStorageUploadError", () =>
          c.json<UsersContracts.UserErrorResponse, 503>(
            {
              error: UsersContracts.userErrorMessages.AVATAR_UPLOAD_UNAVAILABLE,
              details: { code: UsersContracts.UserErrorCodeSchema.enum.AVATAR_UPLOAD_UNAVAILABLE },
            },
            503,
          )),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

const changePassword: RouteHandler<UsersRoutes["changePassword"]> = async (c) => {
  const userId = c.var.currentUser?.userId;
  if (!userId) {
    return c.json(
      {
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      },
      401,
    );
  }

  const body = c.req.valid("json");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* UserCommandServiceTag;
      return yield* service.changePassword({
        id: userId,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      });
    }),
    routeContext(users.changePassword),
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      if (right._tag === "Some") {
        return c.body(null, 204);
      }
      return c.json<UsersContracts.UserErrorResponse, 404>(
        {
          error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
        },
        404,
      );
    }),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("InvalidCurrentPassword", () =>
          c.json<UsersContracts.UserErrorResponse, 400>(
            {
              error: UsersContracts.userErrorMessages.INVALID_CURRENT_PASSWORD,
              details: { code: UsersContracts.UserErrorCodeSchema.enum.INVALID_CURRENT_PASSWORD },
            },
            400,
          )),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

export const UsersController = {
  me,
  updateMe,
  uploadMyAvatar,
  changePassword,
} as const;
