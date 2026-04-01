import { Data, Effect, Either, Layer, Option } from "effect";
import { fileTypeFromBuffer } from "file-type";
import { Buffer } from "node:buffer";
import sharp from "sharp";
import { uuidv7 } from "uuidv7";

import type {
  FirebaseStorageInitError,
  FirebaseStorageUploadError,
} from "@/infrastructure/firebase";

import { FirebaseStorage } from "@/infrastructure/firebase";

import type {
  DuplicateUserEmail,
  DuplicateUserPhoneNumber,
} from "../domain-errors";
import type { UserRow } from "../models";

import { UserCommandServiceTag } from "./user-command.service";
import { UserQueryServiceTag } from "./user-query.service";

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_MAX_DIMENSION = 4096;
const AVATAR_OUTPUT_SIZE = 512;
const AVATAR_OUTPUT_CONTENT_TYPE = "image/webp" as const;
const AVATAR_OUTPUT_EXTENSION = "webp" as const;
const AVATAR_ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type AllowedAvatarContentType = (typeof AVATAR_ALLOWED_CONTENT_TYPES)[number];

export class AvatarImageTooLarge extends Data.TaggedError("AvatarImageTooLarge")<{
  readonly actualBytes: number;
  readonly maxBytes: number;
}> {}

export class AvatarImageUnsupportedType extends Data.TaggedError("AvatarImageUnsupportedType")<{
  readonly detectedContentType: string | null;
  readonly allowedContentTypes: readonly AllowedAvatarContentType[];
}> {}

export class AvatarImageInvalid extends Data.TaggedError("AvatarImageInvalid")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class AvatarImageDimensionsExceeded extends Data.TaggedError("AvatarImageDimensionsExceeded")<{
  readonly width: number;
  readonly height: number;
  readonly maxDimension: number;
}> {}

export type AvatarImageError
  = | AvatarImageDimensionsExceeded
    | AvatarImageInvalid
    | AvatarImageTooLarge
    | AvatarImageUnsupportedType;

export type ProcessedAvatarImage = {
  readonly bytes: Buffer;
  readonly contentType: typeof AVATAR_OUTPUT_CONTENT_TYPE;
  readonly extension: typeof AVATAR_OUTPUT_EXTENSION;
  readonly width: number;
  readonly height: number;
  readonly size: number;
  readonly originalContentType: AllowedAvatarContentType;
};

export type UploadedAvatarImage = {
  readonly bucket: string;
  readonly downloadToken: string;
  readonly downloadUrl: string;
  readonly path: string;
  readonly contentType: typeof AVATAR_OUTPUT_CONTENT_TYPE;
  readonly width: number;
  readonly height: number;
  readonly size: number;
};

export type AvatarUploadError = AvatarImageError | FirebaseStorageInitError | FirebaseStorageUploadError;
export type UpdateUserAvatarError
  = | AvatarUploadError
    | DuplicateUserEmail
    | DuplicateUserPhoneNumber;
export type AvatarUploadServiceError = UpdateUserAvatarError;

function isAllowedAvatarContentType(value: string): value is AllowedAvatarContentType {
  return AVATAR_ALLOWED_CONTENT_TYPES.includes(value as AllowedAvatarContentType);
}

function extractManagedAvatarPath(args: {
  readonly avatarUrl: string | null;
  readonly bucket: string;
  readonly userId: string;
}) {
  const { avatarUrl, bucket, userId } = args;

  if (!avatarUrl) {
    return null;
  }

  try {
    const parsed = new URL(avatarUrl);
    const objectPrefix = `/v0/b/${bucket}/o/`;

    if (parsed.origin !== "https://firebasestorage.googleapis.com") {
      return null;
    }

    if (!parsed.pathname.startsWith(objectPrefix)) {
      return null;
    }

    const encodedPath = parsed.pathname.slice(objectPrefix.length);
    const objectPath = decodeURIComponent(encodedPath);

    if (!objectPath.startsWith(`users/${userId}/avatars/`)) {
      return null;
    }

    return objectPath;
  }
  catch {
    return null;
  }
}

export function processAvatarImageUpload(args: {
  readonly bytes: Buffer | Uint8Array;
}): Effect.Effect<ProcessedAvatarImage, AvatarImageError, never> {
  return Effect.gen(function* () {
    const body = Buffer.isBuffer(args.bytes) ? args.bytes : Buffer.from(args.bytes);

    if (body.byteLength > AVATAR_MAX_BYTES) {
      return yield* Effect.fail(new AvatarImageTooLarge({
        actualBytes: body.byteLength,
        maxBytes: AVATAR_MAX_BYTES,
      }));
    }

    const detected = yield* Effect.tryPromise({
      try: () => fileTypeFromBuffer(body),
      catch: cause =>
        new AvatarImageInvalid({
          message: "Failed to inspect avatar image bytes.",
          cause,
        }),
    });

    if (!detected || !isAllowedAvatarContentType(detected.mime)) {
      return yield* Effect.fail(new AvatarImageUnsupportedType({
        detectedContentType: detected?.mime ?? null,
        allowedContentTypes: AVATAR_ALLOWED_CONTENT_TYPES,
      }));
    }

    const metadata = yield* Effect.tryPromise({
      try: () => sharp(body, { failOn: "error" }).metadata(),
      catch: cause =>
        new AvatarImageInvalid({
          message: "Avatar image is not a valid decodable image.",
          cause,
        }),
    });

    if (!metadata.width || !metadata.height) {
      return yield* Effect.fail(new AvatarImageInvalid({
        message: "Avatar image dimensions could not be determined.",
      }));
    }

    if ((metadata.pages ?? 1) > 1) {
      return yield* Effect.fail(new AvatarImageInvalid({
        message: "Animated avatar images are not supported.",
      }));
    }

    if (metadata.width > AVATAR_MAX_DIMENSION || metadata.height > AVATAR_MAX_DIMENSION) {
      return yield* Effect.fail(new AvatarImageDimensionsExceeded({
        width: metadata.width,
        height: metadata.height,
        maxDimension: AVATAR_MAX_DIMENSION,
      }));
    }

    const transformed = yield* Effect.tryPromise({
      try: () =>
        sharp(body, { failOn: "error" })
          .rotate()
          .resize(AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE, {
            fit: "cover",
            position: "attention",
          })
          .webp({ quality: 82 })
          .toBuffer({ resolveWithObject: true }),
      catch: cause =>
        new AvatarImageInvalid({
          message: "Failed to normalize avatar image.",
          cause,
        }),
    });

    return {
      bytes: transformed.data,
      contentType: AVATAR_OUTPUT_CONTENT_TYPE,
      extension: AVATAR_OUTPUT_EXTENSION,
      width: transformed.info.width,
      height: transformed.info.height,
      size: transformed.data.byteLength,
      originalContentType: detected.mime,
    } satisfies ProcessedAvatarImage;
  });
}

export function uploadUserAvatar(args: {
  readonly userId: string;
  readonly bytes: Buffer | Uint8Array;
  readonly originalFilename?: string | null;
}): Effect.Effect<UploadedAvatarImage, AvatarUploadError, FirebaseStorage> {
  return Effect.gen(function* () {
    const storage = yield* FirebaseStorage;
    const processed = yield* processAvatarImageUpload({ bytes: args.bytes });
    const downloadToken = uuidv7();
    const objectPath = `users/${args.userId}/avatars/${uuidv7()}.${processed.extension}`;

    const uploaded = yield* storage.uploadObject({
      path: objectPath,
      bytes: processed.bytes,
      contentType: processed.contentType,
      cacheControl: "private, max-age=31536000, immutable",
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
        userId: args.userId,
        uploadKind: "avatar",
        ...(args.originalFilename ? { originalFilename: args.originalFilename } : {}),
      },
    });

    const downloadUrl = storage.buildDownloadUrl({
      path: uploaded.path,
      downloadToken,
    });

    return {
      bucket: uploaded.bucket,
      downloadToken,
      downloadUrl,
      path: uploaded.path,
      contentType: processed.contentType,
      width: processed.width,
      height: processed.height,
      size: processed.size,
    } satisfies UploadedAvatarImage;
  });
}

export function updateUserAvatarUseCase(args: {
  readonly userId: string;
  readonly bytes: Buffer | Uint8Array;
  readonly originalFilename?: string | null;
}) {
  return Effect.gen(function* () {
    const storage = yield* FirebaseStorage;
    const queryService = yield* UserQueryServiceTag;
    const service = yield* UserCommandServiceTag;
    const currentUser = yield* queryService.getById(args.userId);

    if (Option.isNone(currentUser)) {
      return Option.none<UserRow>();
    }

    const previousAvatarPath = storage.bucket
      ? extractManagedAvatarPath({
          avatarUrl: currentUser.value.avatar,
          bucket: storage.bucket,
          userId: args.userId,
        })
      : null;

    const uploaded = yield* uploadUserAvatar(args);

    const updated = yield* service.updateProfile(args.userId, {
      avatar: uploaded.downloadUrl,
    }).pipe(Effect.either);

    if (Either.isLeft(updated)) {
      yield* storage.deleteObject(uploaded.path).pipe(Effect.ignore);
      return yield* Effect.fail(updated.left);
    }

    if (Option.isNone(updated.right)) {
      yield* storage.deleteObject(uploaded.path).pipe(Effect.ignore);
    }

    if (
      Option.isSome(updated.right)
      && previousAvatarPath
      && previousAvatarPath !== uploaded.path
    ) {
      yield* storage.deleteObject(previousAvatarPath).pipe(Effect.ignore);
    }

    return updated.right;
  });
}

type AvatarUploadService = {
  readonly uploadForUser: (args: {
    readonly userId: string;
    readonly bytes: Buffer | Uint8Array;
    readonly originalFilename?: string | null;
  }) => Effect.Effect<import("effect/Option").Option<UserRow>, AvatarUploadServiceError, FirebaseStorage>;
};

const makeAvatarUploadService = Effect.gen(function* () {
  const userQueryService = yield* UserQueryServiceTag;
  const userService = yield* UserCommandServiceTag;

  return {
    uploadForUser: args =>
      Effect.gen(function* () {
        const storage = yield* FirebaseStorage;

        return yield* updateUserAvatarUseCase(args).pipe(
          Effect.provideService(FirebaseStorage, storage),
          Effect.provideService(UserQueryServiceTag, userQueryService),
          Effect.provideService(UserCommandServiceTag, userService),
        );
      }),
  } satisfies AvatarUploadService;
});

export class AvatarUploadServiceTag extends Effect.Service<AvatarUploadServiceTag>()("AvatarUploadService", {
  effect: makeAvatarUploadService,
}) {}

export const AvatarUploadServiceLive = Layer.effect(
  AvatarUploadServiceTag,
  makeAvatarUploadService.pipe(Effect.map(AvatarUploadServiceTag.make)),
);

export const avatarImagePolicy = {
  allowedContentTypes: AVATAR_ALLOWED_CONTENT_TYPES,
  maxBytes: AVATAR_MAX_BYTES,
  maxDimension: AVATAR_MAX_DIMENSION,
  outputContentType: AVATAR_OUTPUT_CONTENT_TYPE,
  outputExtension: AVATAR_OUTPUT_EXTENSION,
  outputSize: AVATAR_OUTPUT_SIZE,
} as const;
