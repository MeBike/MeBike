import { Effect, Layer } from "effect";
import { Buffer } from "node:buffer";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { FirebaseStorage } from "@/infrastructure/firebase";
import { expectLeftTag } from "@/test/effect/assertions";
import { runEffect, runEffectEither, runEffectWithLayer } from "@/test/effect/run";

import type {
  AvatarImageTooLarge,
  AvatarImageUnsupportedType,
} from "../avatar-upload.service";

import {
  avatarImagePolicy,
  processAvatarImageUpload,
  uploadUserAvatar,
} from "../avatar-upload.service";

describe("avatar upload service", () => {
  it("normalizes a supported image into a square webp avatar", async () => {
    const input = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: { r: 24, g: 90, b: 180 },
      },
    }).png().toBuffer();

    const result = await runEffect(processAvatarImageUpload({ bytes: input }));
    const metadata = await sharp(result.bytes).metadata();

    expect(result.contentType).toBe("image/webp");
    expect(result.extension).toBe("webp");
    expect(result.width).toBe(avatarImagePolicy.outputSize);
    expect(result.height).toBe(avatarImagePolicy.outputSize);
    expect(metadata.width).toBe(avatarImagePolicy.outputSize);
    expect(metadata.height).toBe(avatarImagePolicy.outputSize);
    expect(result.originalContentType).toBe("image/png");
  });

  it("rejects unsupported avatar file types", async () => {
    const result = await runEffectEither(processAvatarImageUpload({
      bytes: Buffer.from("not-an-image"),
    }));

    const error = expectLeftTag(result, "AvatarImageUnsupportedType") as AvatarImageUnsupportedType;
    expect(error.detectedContentType).toBeNull();
  });

  it("rejects avatar payloads above the size cap", async () => {
    const result = await runEffectEither(processAvatarImageUpload({
      bytes: Buffer.alloc(avatarImagePolicy.maxBytes + 1),
    }));

    const error = expectLeftTag(result, "AvatarImageTooLarge") as AvatarImageTooLarge;
    expect(error.maxBytes).toBe(avatarImagePolicy.maxBytes);
    expect(error.actualBytes).toBe(avatarImagePolicy.maxBytes + 1);
  });

  it("uploads normalized avatar bytes through Firebase storage", async () => {
    const input = await sharp({
      create: {
        width: 900,
        height: 1200,
        channels: 3,
        background: { r: 220, g: 160, b: 80 },
      },
    }).jpeg().toBuffer();

    const capture: {
      current: {
        path: string;
        bytes: Buffer | Uint8Array;
        contentType: string;
        cacheControl?: string;
        metadata?: Record<string, string>;
      } | null;
    } = { current: null };

    const layer = Layer.succeed(FirebaseStorage, FirebaseStorage.make({
      bucket: "test-bucket",
      buildDownloadUrl: ({ path, downloadToken }) =>
        `https://firebasestorage.googleapis.com/v0/b/test-bucket/o/${encodeURIComponent(path)}?alt=media&token=${encodeURIComponent(downloadToken)}`,
      uploadObject: (params) => {
        capture.current = params;
        return Effect.succeed({
          bucket: "test-bucket",
          path: params.path,
          contentType: params.contentType,
          size: Buffer.isBuffer(params.bytes) ? params.bytes.byteLength : params.bytes.byteLength,
        });
      },
      deleteObject: () => Effect.void,
      getSignedReadUrl: () => Effect.succeed("https://example.com/signed-url"),
      inspectBucket: () => Effect.succeed({
        name: "test-bucket",
        location: "local",
        publicAccessPrevention: "enforced",
        uniformBucketLevelAccess: true,
      }),
    }));

    const uploaded = await runEffectWithLayer(uploadUserAvatar({
      userId: "user_123",
      bytes: input,
      originalFilename: "avatar.jpg",
    }), layer);

    expect(uploaded.bucket).toBe("test-bucket");
    expect(uploaded.contentType).toBe("image/webp");
    expect(uploaded.downloadUrl).toContain("https://firebasestorage.googleapis.com/v0/b/test-bucket/o/");
    expect(uploaded.width).toBe(avatarImagePolicy.outputSize);
    expect(uploaded.height).toBe(avatarImagePolicy.outputSize);
    expect(uploaded.path).toMatch(/^users\/user_123\/avatars\/.+\.webp$/);

    expect(capture.current).not.toBeNull();
    const upload = capture.current;
    if (!upload) {
      throw new Error("Expected upload payload to be captured");
    }

    expect(upload.contentType).toBe("image/webp");
    expect(upload.cacheControl).toBe("private, max-age=31536000, immutable");
    expect(upload.metadata).toMatchObject({
      userId: "user_123",
      uploadKind: "avatar",
      originalFilename: "avatar.jpg",
    });

    const processedMetadata = await sharp(Buffer.from(upload.bytes)).metadata();
    expect(processedMetadata.width).toBe(avatarImagePolicy.outputSize);
    expect(processedMetadata.height).toBe(avatarImagePolicy.outputSize);
  });
});
