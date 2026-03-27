import { UsersContracts } from "@mebike/shared";
import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22388";

describe("user avatar upload route e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Effect, Layer, Option } = await import("effect");
      const {
        AvatarUploadServiceTag,
        UserCommandServiceTag,
        UserQueryServiceTag,
      } = await import("@/domain/users");
      const {
        FirebaseStorageInitError,
        FirebaseStorageUploadError,
      } = await import("@/infrastructure/firebase");
      const {
        UserCommandReposLive,
        UserCommandServiceLayer,
        UserQueryReposLive,
        UserQueryServiceLayer,
      } = await import("@/http/shared/features/user.layers");

      const avatarUploadLayer = Layer.effect(
        AvatarUploadServiceTag,
        Effect.gen(function* () {
          const commandService = yield* UserCommandServiceTag;
          const queryService = yield* UserQueryServiceTag;

          return AvatarUploadServiceTag.make({
            uploadForUser: ({ userId, bytes, originalFilename }) =>
              Effect.gen(function* () {
                if (originalFilename === "storage-unavailable.png") {
                  return yield* Effect.fail(new FirebaseStorageInitError({
                    message: "Firebase Storage is not configured.",
                  }));
                }

                if (originalFilename === "upload-failed.png") {
                  return yield* Effect.fail(new FirebaseStorageUploadError({
                    message: "Firebase Storage upload failed.",
                    path: `users/${userId}/avatars/upload-failed.webp`,
                  }));
                }

                const current = yield* queryService.getById(userId);

                if (Option.isNone(current)) {
                  return Option.none();
                }

                return yield* commandService.updateProfile(userId, {
                  avatar: `https://cdn.example.com/avatars/${originalFilename ?? bytes.byteLength}.webp`,
                });
              }),
          });
        }),
      ).pipe(
        Layer.provide(UserQueryServiceLayer),
        Layer.provide(UserCommandServiceLayer),
      );

      return Layer.mergeAll(
        UserQueryReposLive,
        UserCommandReposLive,
        UserQueryServiceLayer,
        UserCommandServiceLayer,
        avatarUploadLayer,
      );
    },
    seedData: async (_db, prisma) => {
      await prisma.user.create({
        data: {
          id: USER_ID,
          fullName: "Avatar User",
          email: "avatar-user@example.com",
          passwordHash: "hash123",
          phoneNumber: null,
          username: null,
          avatarUrl: null,
          locationText: null,
          nfcCardUid: null,
          role: "USER",
          accountStatus: "ACTIVE",
          verifyStatus: "VERIFIED",
        },
      });
    },
  });

  it("returns 401 without auth", async () => {
    const form = new FormData();
    form.append("avatar", new File([new Uint8Array([1, 2, 3])], "avatar.png", { type: "image/png" }));

    const response = await fixture.app.request("http://test/v1/users/me/avatar", {
      method: "PUT",
      body: form,
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 when avatar file is missing", async () => {
    const token = fixture.auth.makeAccessToken({ userId: USER_ID, role: "USER" });
    const form = new FormData();
    form.append("note", "missing-avatar");

    const response = await fixture.app.request("http://test/v1/users/me/avatar", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });
    const body = await response.json() as UsersContracts.UserErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details.code).toBe(UsersContracts.UserErrorCodeSchema.enum.INVALID_AVATAR_IMAGE);
  });

  it("returns 413 when multipart payload exceeds the route body limit", async () => {
    const token = fixture.auth.makeAccessToken({ userId: USER_ID, role: "USER" });
    const form = new FormData();
    form.append(
      "avatar",
      new File([new Uint8Array([1, 2, 3])], "too-large.png", { type: "image/png" }),
    );

    const response = await fixture.app.request("http://test/v1/users/me/avatar", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Length": String(6 * 1024 * 1024 + 1),
      },
      body: form,
    });
    const body = await response.json() as UsersContracts.UserErrorResponse;

    expect(response.status).toBe(413);
    expect(body.details.code).toBe(UsersContracts.UserErrorCodeSchema.enum.AVATAR_IMAGE_TOO_LARGE);
  });

  it("returns 503 when avatar storage is unavailable", async () => {
    const token = fixture.auth.makeAccessToken({ userId: USER_ID, role: "USER" });
    const form = new FormData();
    form.append(
      "avatar",
      new File([new Uint8Array([1, 2, 3])], "storage-unavailable.png", { type: "image/png" }),
    );

    const response = await fixture.app.request("http://test/v1/users/me/avatar", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });
    const body = await response.json() as UsersContracts.UserErrorResponse;

    expect(response.status).toBe(503);
    expect(body.details.code).toBe(UsersContracts.UserErrorCodeSchema.enum.AVATAR_UPLOAD_UNAVAILABLE);
  });

  it("returns 503 when avatar upload fails after storage init", async () => {
    const token = fixture.auth.makeAccessToken({ userId: USER_ID, role: "USER" });
    const form = new FormData();
    form.append(
      "avatar",
      new File([new Uint8Array([1, 2, 3])], "upload-failed.png", { type: "image/png" }),
    );

    const response = await fixture.app.request("http://test/v1/users/me/avatar", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });
    const body = await response.json() as UsersContracts.UserErrorResponse;

    expect(response.status).toBe(503);
    expect(body.details.code).toBe(UsersContracts.UserErrorCodeSchema.enum.AVATAR_UPLOAD_UNAVAILABLE);
  });

  it("updates the authenticated user avatar", async () => {
    const token = fixture.auth.makeAccessToken({ userId: USER_ID, role: "USER" });
    const form = new FormData();
    form.append(
      "avatar",
      new File([new Uint8Array([137, 80, 78, 71])], "avatar.png", { type: "image/png" }),
    );

    const response = await fixture.app.request("http://test/v1/users/me/avatar", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });
    const body = await response.json() as UsersContracts.UpdateMeResponse;

    expect(response.status).toBe(200);
    expect(body.avatar).toBe("https://cdn.example.com/avatars/avatar.png.webp");

    const persisted = await fixture.prisma.user.findUniqueOrThrow({ where: { id: USER_ID } });
    expect(persisted.avatarUrl).toBe("https://cdn.example.com/avatars/avatar.png.webp");
  });
});
