import { Data, Effect, Layer } from "effect";
import { fileTypeFromBuffer } from "file-type";
import { Buffer } from "node:buffer";
import sharp from "sharp";
import { uuidv7 } from "uuidv7";

import type {
  FirebaseStorageInitError,
  FirebaseStorageUploadError,
} from "@/infrastructure/firebase";

import { FirebaseStorage } from "@/infrastructure/firebase";

const INCIDENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const INCIDENT_IMAGE_MAX_DIMENSION = 4096;
const INCIDENT_IMAGE_OUTPUT_MAX_DIMENSION = 1920;
const INCIDENT_IMAGE_OUTPUT_CONTENT_TYPE = "image/webp" as const;
const INCIDENT_IMAGE_OUTPUT_EXTENSION = "webp" as const;
const INCIDENT_IMAGE_ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type AllowedIncidentImageContentType = (typeof INCIDENT_IMAGE_ALLOWED_CONTENT_TYPES)[number];

export class IncidentImageTooLarge extends Data.TaggedError("IncidentImageTooLarge")<{
  readonly actualBytes: number;
  readonly maxBytes: number;
}> {}

export class IncidentImageUnsupportedType extends Data.TaggedError("IncidentImageUnsupportedType")<{
  readonly detectedContentType: string | null;
  readonly allowedContentTypes: readonly AllowedIncidentImageContentType[];
}> {}

export class IncidentImageInvalid extends Data.TaggedError("IncidentImageInvalid")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class IncidentImageDimensionsExceeded extends Data.TaggedError("IncidentImageDimensionsExceeded")<{
  readonly width: number;
  readonly height: number;
  readonly maxDimension: number;
}> {}

export type IncidentImageUploadError
  = | IncidentImageDimensionsExceeded
    | IncidentImageInvalid
    | IncidentImageTooLarge
    | IncidentImageUnsupportedType
    | FirebaseStorageInitError
    | FirebaseStorageUploadError;

type ProcessedIncidentImage = {
  readonly bytes: Buffer;
  readonly contentType: typeof INCIDENT_IMAGE_OUTPUT_CONTENT_TYPE;
  readonly extension: typeof INCIDENT_IMAGE_OUTPUT_EXTENSION;
  readonly width: number;
  readonly height: number;
  readonly size: number;
};

type UploadedIncidentImage = {
  readonly downloadUrl: string;
  readonly path: string;
};

type IncidentImageUploadService = {
  readonly uploadForUser: (args: {
    readonly files: ReadonlyArray<{
      readonly bytes: Buffer | Uint8Array;
      readonly originalFilename?: string | null;
    }>;
    readonly userId: string;
  }) => Effect.Effect<{ readonly fileUrls: string[] }, IncidentImageUploadError, FirebaseStorage>;
};

function isAllowedIncidentImageContentType(value: string): value is AllowedIncidentImageContentType {
  return INCIDENT_IMAGE_ALLOWED_CONTENT_TYPES.includes(value as AllowedIncidentImageContentType);
}

function processIncidentImageUpload(args: {
  readonly bytes: Buffer | Uint8Array;
}): Effect.Effect<ProcessedIncidentImage, IncidentImageUploadError, never> {
  return Effect.gen(function* () {
    const body = Buffer.isBuffer(args.bytes) ? args.bytes : Buffer.from(args.bytes);

    if (body.byteLength > INCIDENT_IMAGE_MAX_BYTES) {
      return yield* Effect.fail(new IncidentImageTooLarge({
        actualBytes: body.byteLength,
        maxBytes: INCIDENT_IMAGE_MAX_BYTES,
      }));
    }

    const detected = yield* Effect.tryPromise({
      try: () => fileTypeFromBuffer(body),
      catch: cause =>
        new IncidentImageInvalid({
          message: "Failed to inspect incident image bytes.",
          cause,
        }),
    });

    if (!detected || !isAllowedIncidentImageContentType(detected.mime)) {
      return yield* Effect.fail(new IncidentImageUnsupportedType({
        detectedContentType: detected?.mime ?? null,
        allowedContentTypes: INCIDENT_IMAGE_ALLOWED_CONTENT_TYPES,
      }));
    }

    const metadata = yield* Effect.tryPromise({
      try: () => sharp(body, { failOn: "error" }).metadata(),
      catch: cause =>
        new IncidentImageInvalid({
          message: "Incident image is not a valid decodable image.",
          cause,
        }),
    });

    if (!metadata.width || !metadata.height) {
      return yield* Effect.fail(new IncidentImageInvalid({
        message: "Incident image dimensions could not be determined.",
      }));
    }

    if ((metadata.pages ?? 1) > 1) {
      return yield* Effect.fail(new IncidentImageInvalid({
        message: "Animated incident images are not supported.",
      }));
    }

    if (metadata.width > INCIDENT_IMAGE_MAX_DIMENSION || metadata.height > INCIDENT_IMAGE_MAX_DIMENSION) {
      return yield* Effect.fail(new IncidentImageDimensionsExceeded({
        width: metadata.width,
        height: metadata.height,
        maxDimension: INCIDENT_IMAGE_MAX_DIMENSION,
      }));
    }

    const transformed = yield* Effect.tryPromise({
      try: () =>
        sharp(body, { failOn: "error" })
          .rotate()
          .resize(INCIDENT_IMAGE_OUTPUT_MAX_DIMENSION, INCIDENT_IMAGE_OUTPUT_MAX_DIMENSION, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 84 })
          .toBuffer({ resolveWithObject: true }),
      catch: cause =>
        new IncidentImageInvalid({
          message: "Failed to normalize incident image.",
          cause,
        }),
    });

    return {
      bytes: transformed.data,
      contentType: INCIDENT_IMAGE_OUTPUT_CONTENT_TYPE,
      extension: INCIDENT_IMAGE_OUTPUT_EXTENSION,
      width: transformed.info.width,
      height: transformed.info.height,
      size: transformed.data.byteLength,
    } satisfies ProcessedIncidentImage;
  });
}

function uploadIncidentImage(args: {
  readonly bytes: Buffer | Uint8Array;
  readonly originalFilename?: string | null;
  readonly userId: string;
}): Effect.Effect<UploadedIncidentImage, IncidentImageUploadError, FirebaseStorage> {
  return Effect.gen(function* () {
    const storage = yield* FirebaseStorage;
    const processed = yield* processIncidentImageUpload({ bytes: args.bytes });
    const downloadToken = uuidv7();
    const objectPath = `users/${args.userId}/incidents/${uuidv7()}.${processed.extension}`;

    const uploaded = yield* storage.uploadObject({
      path: objectPath,
      bytes: processed.bytes,
      contentType: processed.contentType,
      cacheControl: "private, max-age=31536000, immutable",
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
        userId: args.userId,
        uploadKind: "incident_image",
        ...(args.originalFilename ? { originalFilename: args.originalFilename } : {}),
      },
    });

    return {
      downloadUrl: storage.buildDownloadUrl({
        path: uploaded.path,
        downloadToken,
      }),
      path: uploaded.path,
    } satisfies UploadedIncidentImage;
  });
}

const makeIncidentImageUploadService = Effect.gen(function* () {
  return {
    uploadForUser: args =>
      Effect.gen(function* () {
        const storage = yield* FirebaseStorage;
        const uploaded: UploadedIncidentImage[] = [];

        for (const file of args.files) {
          const nextUploaded = yield* uploadIncidentImage({
            userId: args.userId,
            bytes: file.bytes,
            originalFilename: file.originalFilename,
          }).pipe(
            Effect.catchAll(error =>
              Effect.gen(function* () {
                yield* Effect.forEach(
                  uploaded,
                  image => storage.deleteObject(image.path).pipe(Effect.ignore),
                  { concurrency: "unbounded" },
                );

                return yield* Effect.fail(error);
              })),
          );

          uploaded.push(nextUploaded);
        }

        return {
          fileUrls: uploaded.map(image => image.downloadUrl),
        } as const;
      }),
  } satisfies IncidentImageUploadService;
});

export class IncidentImageUploadServiceTag extends Effect.Service<IncidentImageUploadServiceTag>()("IncidentImageUploadService", {
  effect: makeIncidentImageUploadService,
}) {}

export const IncidentImageUploadServiceLive = Layer.effect(
  IncidentImageUploadServiceTag,
  makeIncidentImageUploadService.pipe(Effect.map(IncidentImageUploadServiceTag.make)),
);

export const incidentImagePolicy = {
  allowedContentTypes: INCIDENT_IMAGE_ALLOWED_CONTENT_TYPES,
  maxBytes: INCIDENT_IMAGE_MAX_BYTES,
  maxDimension: INCIDENT_IMAGE_MAX_DIMENSION,
  outputContentType: INCIDENT_IMAGE_OUTPUT_CONTENT_TYPE,
  outputExtension: INCIDENT_IMAGE_OUTPUT_EXTENSION,
  outputMaxDimension: INCIDENT_IMAGE_OUTPUT_MAX_DIMENSION,
} as const;
