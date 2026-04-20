import { serverRoutes, UsersContracts } from "@mebike/shared";
import { bodyLimit } from "hono/body-limit";

import { UsersController } from "@/http/controllers/users";

const AVATAR_REQUEST_MAX_BYTES = 6 * 1024 * 1024;

function avatarTooLargeResponse(c: import("hono").Context) {
  return c.json(
    {
      error: UsersContracts.userErrorMessages.AVATAR_IMAGE_TOO_LARGE,
      details: { code: UsersContracts.UserErrorCodeSchema.enum.AVATAR_IMAGE_TOO_LARGE },
    },
    413,
  );
}

export function registerUserSelfRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const users = serverRoutes.users;
  app.openapi(users.me, UsersController.me);
  app.openapi(users.updateMe, UsersController.updateMe);
  app.use(users.uploadMyAvatar.path, async (c, next) => {
    const contentLength = c.req.header("content-length");
    const parsedLength = contentLength ? Number(contentLength) : null;

    if (parsedLength !== null && Number.isFinite(parsedLength) && parsedLength > AVATAR_REQUEST_MAX_BYTES) {
      return avatarTooLargeResponse(c);
    }

    await next();
  });
  app.use(users.uploadMyAvatar.path, bodyLimit({
    maxSize: AVATAR_REQUEST_MAX_BYTES,
    onError: c => avatarTooLargeResponse(c),
  }));
  app.openapi(users.uploadMyAvatar, UsersController.uploadMyAvatar);
  app.openapi(users.changePassword, UsersController.changePassword);
}
