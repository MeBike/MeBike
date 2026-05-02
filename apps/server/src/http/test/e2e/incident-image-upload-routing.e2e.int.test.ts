import { IncidentsContracts } from "@mebike/shared";
import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22389";

describe("incident image upload route e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Effect, Layer } = await import("effect");
      const { IncidentImageUploadServiceTag } = await import("@/domain/incidents");
      const {
        FirebaseStorageInitError,
        FirebaseStorageUploadError,
      } = await import("@/infrastructure/firebase");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      const incidentImageUploadLayer = Layer.effect(
        IncidentImageUploadServiceTag,
        Effect.succeed(
          IncidentImageUploadServiceTag.make({
            uploadForUser: ({ files }) =>
              Effect.gen(function* () {
                const firstFilename = files[0]?.originalFilename ?? null;

                if (firstFilename === "storage-unavailable.png") {
                  return yield* Effect.fail(new FirebaseStorageInitError({
                    message: "Firebase Storage is not configured.",
                  }));
                }

                if (firstFilename === "upload-failed.png") {
                  return yield* Effect.fail(new FirebaseStorageUploadError({
                    message: "Firebase Storage upload failed.",
                    path: `users/${USER_ID}/incidents/upload-failed.webp`,
                  }));
                }

                return {
                  fileUrls: files.map((file, index) =>
                    `https://cdn.example.com/incidents/${file.originalFilename ?? `incident-${index + 1}`}.webp`),
                } as const;
              }),
          }),
        ),
      );

      return Layer.mergeAll(
        UserDepsLive,
        incidentImageUploadLayer,
      );
    },
    seedData: async (_db, prisma) => {
      await prisma.user.create({
        data: {
          id: USER_ID,
          fullName: "Incident Reporter",
          email: "incident-reporter@example.com",
          passwordHash: "hash123",
          phoneNumber: null,
          username: null,
          avatarUrl: null,
          locationText: null,
          role: "USER",
          accountStatus: "ACTIVE",
          verifyStatus: "VERIFIED",
        },
      });
    },
  });

  it("returns 401 without auth", async () => {
    const form = new FormData();
    form.append("files", new File([new Uint8Array([1, 2, 3])], "incident.png", { type: "image/png" }));

    const response = await fixture.app.request("http://test/v1/incidents/images", {
      method: "POST",
      body: form,
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 when multipart files are missing", async () => {
    const token = fixture.auth.makeAccessToken({ userId: USER_ID, role: "USER" });
    const form = new FormData();
    form.append("note", "missing-files");

    const response = await fixture.app.request("http://test/v1/incidents/images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });
    const body = await response.json() as IncidentsContracts.IncidentErrorResponse;

    expect(response.status).toBe(400);
    expect(body.details?.code).toBe(IncidentsContracts.IncidentErrorCodeSchema.enum.INVALID_INCIDENT_IMAGE);
  });

  it("returns 413 when multipart payload exceeds the route body limit", async () => {
    const token = fixture.auth.makeAccessToken({ userId: USER_ID, role: "USER" });
    const form = new FormData();
    form.append(
      "files",
      new File([new Uint8Array([1, 2, 3])], "too-large.png", { type: "image/png" }),
    );

    const response = await fixture.app.request("http://test/v1/incidents/images", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Length": String(26 * 1024 * 1024 + 1),
      },
      body: form,
    });
    const body = await response.json() as IncidentsContracts.IncidentErrorResponse;

    expect(response.status).toBe(413);
    expect(body.details?.code).toBe(IncidentsContracts.IncidentErrorCodeSchema.enum.INCIDENT_IMAGE_TOO_LARGE);
  });

  it("returns 503 when incident image storage is unavailable", async () => {
    const token = fixture.auth.makeAccessToken({ userId: USER_ID, role: "USER" });
    const form = new FormData();
    form.append(
      "files",
      new File([new Uint8Array([1, 2, 3])], "storage-unavailable.png", { type: "image/png" }),
    );

    const response = await fixture.app.request("http://test/v1/incidents/images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });
    const body = await response.json() as IncidentsContracts.IncidentErrorResponse;

    expect(response.status).toBe(503);
    expect(body.details?.code).toBe(IncidentsContracts.IncidentErrorCodeSchema.enum.INCIDENT_IMAGE_UPLOAD_UNAVAILABLE);
  });

  it("returns 503 when incident image upload fails after storage init", async () => {
    const token = fixture.auth.makeAccessToken({ userId: USER_ID, role: "USER" });
    const form = new FormData();
    form.append(
      "files",
      new File([new Uint8Array([1, 2, 3])], "upload-failed.png", { type: "image/png" }),
    );

    const response = await fixture.app.request("http://test/v1/incidents/images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });
    const body = await response.json() as IncidentsContracts.IncidentErrorResponse;

    expect(response.status).toBe(503);
    expect(body.details?.code).toBe(IncidentsContracts.IncidentErrorCodeSchema.enum.INCIDENT_IMAGE_UPLOAD_UNAVAILABLE);
  });

  it("uploads incident images and returns public urls", async () => {
    const token = fixture.auth.makeAccessToken({ userId: USER_ID, role: "USER" });
    const form = new FormData();
    form.append(
      "files",
      new File([new Uint8Array([137, 80, 78, 71])], "incident-a.png", { type: "image/png" }),
    );
    form.append(
      "files",
      new File([new Uint8Array([255, 216, 255])], "incident-b.jpg", { type: "image/jpeg" }),
    );

    const response = await fixture.app.request("http://test/v1/incidents/images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });
    const body = await response.json() as IncidentsContracts.UploadIncidentImagesResponse;

    expect(response.status).toBe(200);
    expect(body.fileUrls).toEqual([
      "https://cdn.example.com/incidents/incident-a.png.webp",
      "https://cdn.example.com/incidents/incident-b.jpg.webp",
    ]);
  });
});
