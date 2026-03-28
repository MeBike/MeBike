import { Data, Effect, Layer } from "effect";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { Buffer } from "node:buffer";

import { env } from "@/config/env";

const FIREBASE_STORAGE_APP_NAME = "server-firebase-storage";

type BucketMetadataSnapshot = {
  readonly name: string;
  readonly location: string;
  readonly publicAccessPrevention: string | null;
  readonly uniformBucketLevelAccess: boolean | null;
};

export class FirebaseStorageInitError extends Data.TaggedError("FirebaseStorageInitError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class FirebaseStorageUploadError extends Data.TaggedError("FirebaseStorageUploadError")<{
  readonly message: string;
  readonly path: string;
  readonly cause?: unknown;
}> {}

export class FirebaseStorageDeleteError extends Data.TaggedError("FirebaseStorageDeleteError")<{
  readonly message: string;
  readonly path: string;
  readonly cause?: unknown;
}> {}

export class FirebaseStorageSignedUrlError extends Data.TaggedError("FirebaseStorageSignedUrlError")<{
  readonly message: string;
  readonly path: string;
  readonly cause?: unknown;
}> {}

export class FirebaseStorageInspectError extends Data.TaggedError("FirebaseStorageInspectError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export type UploadedStorageObject = {
  readonly bucket: string;
  readonly path: string;
  readonly contentType: string | null;
  readonly size: number | null;
};

async function createBucket() {
  const bucketName = env.FIREBASE_STORAGE_BUCKET;

  if (!bucketName) {
    throw new FirebaseStorageInitError({
      message: "FIREBASE_STORAGE_BUCKET is required to use Firebase Storage.",
    });
  }

  const existingApp = getApps().find(app => app.name === FIREBASE_STORAGE_APP_NAME);
  const app = existingApp ?? initializeApp({
    credential: applicationDefault(),
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: bucketName,
  }, FIREBASE_STORAGE_APP_NAME);

  const bucket = getStorage(app).bucket(bucketName);
  await bucket.getMetadata();
  return bucket;
}

type FirebaseBucket = Awaited<ReturnType<typeof createBucket>>;

let cachedBucketPromise: Promise<FirebaseBucket> | null = null;

function getInitializedBucket() {
  return Effect.tryPromise({
    try: async () => {
      if (!cachedBucketPromise) {
        cachedBucketPromise = createBucket().catch((error) => {
          cachedBucketPromise = null;
          throw error;
        });
      }

      return await cachedBucketPromise;
    },
    catch: cause =>
      cause instanceof FirebaseStorageInitError
        ? cause
        : new FirebaseStorageInitError({
            message:
              "Failed to initialize Firebase Storage. Check bucket configuration and Application Default Credentials.",
            cause,
          }),
  });
}

export type FirebaseStorageService = {
  readonly bucket: string | null;
  buildDownloadUrl: (params: {
    readonly path: string;
    readonly downloadToken: string;
  }) => string;
  uploadObject: (params: {
    readonly path: string;
    readonly bytes: Buffer | Uint8Array;
    readonly contentType: string;
    readonly cacheControl?: string;
    readonly metadata?: Record<string, string>;
  }) => Effect.Effect<UploadedStorageObject, FirebaseStorageInitError | FirebaseStorageUploadError, never>;
  deleteObject: (path: string) => Effect.Effect<void, FirebaseStorageInitError | FirebaseStorageDeleteError, never>;
  getSignedReadUrl: (params: {
    readonly path: string;
    readonly expiresAt: Date;
  }) => Effect.Effect<string, FirebaseStorageInitError | FirebaseStorageSignedUrlError, never>;
  inspectBucket: () => Effect.Effect<BucketMetadataSnapshot, FirebaseStorageInitError | FirebaseStorageInspectError, never>;
};

const makeFirebaseStorage = Effect.succeed({
  bucket: env.FIREBASE_STORAGE_BUCKET ?? null,
  buildDownloadUrl: ({ path, downloadToken }) => {
    const bucketName = env.FIREBASE_STORAGE_BUCKET;

    if (!bucketName) {
      throw new FirebaseStorageInitError({
        message: "FIREBASE_STORAGE_BUCKET is required to build Firebase download URLs.",
      });
    }

    const encodedPath = encodeURIComponent(path);
    const token = encodeURIComponent(downloadToken);
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;
  },
  uploadObject: ({
    path,
    bytes,
    contentType,
    cacheControl,
    metadata,
  }) =>
    Effect.gen(function* () {
      const bucket = yield* getInitializedBucket();

      return yield* Effect.tryPromise({
        try: async () => {
          const file = bucket.file(path);
          const body = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);

          await file.save(body, {
            resumable: false,
            metadata: {
              contentType,
              ...(cacheControl ? { cacheControl } : {}),
              ...(metadata ? { metadata } : {}),
            },
          });

          const [fileMetadata] = await file.getMetadata();

          return {
            bucket: bucket.name,
            path,
            contentType: fileMetadata.contentType ?? null,
            size: fileMetadata.size ? Number(fileMetadata.size) : null,
          } satisfies UploadedStorageObject;
        },
        catch: cause =>
          new FirebaseStorageUploadError({
            message: "Failed to upload object to Firebase Storage.",
            path,
            cause,
          }),
      });
    }),
  deleteObject: path =>
    Effect.gen(function* () {
      const bucket = yield* getInitializedBucket();

      return yield* Effect.tryPromise({
        try: async () => {
          const file = bucket.file(path);
          const [exists] = await file.exists();

          if (!exists) {
            return;
          }

          await file.delete();
        },
        catch: cause =>
          new FirebaseStorageDeleteError({
            message: "Failed to delete object from Firebase Storage.",
            path,
            cause,
          }),
      });
    }),
  getSignedReadUrl: ({ path, expiresAt }) =>
    Effect.gen(function* () {
      const bucket = yield* getInitializedBucket();

      return yield* Effect.tryPromise({
        try: async () => {
          const [url] = await bucket.file(path).getSignedUrl({
            action: "read",
            expires: expiresAt,
          });

          return url;
        },
        catch: cause =>
          new FirebaseStorageSignedUrlError({
            message: "Failed to generate Firebase Storage signed read URL.",
            path,
            cause,
          }),
      });
    }),
  inspectBucket: () =>
    Effect.gen(function* () {
      const bucket = yield* getInitializedBucket();

      return yield* Effect.tryPromise({
        try: async () => {
          const [metadata] = await bucket.getMetadata();

          return {
            name: metadata.name ?? bucket.name,
            location: metadata.location ?? "unknown",
            publicAccessPrevention: metadata.iamConfiguration?.publicAccessPrevention ?? null,
            uniformBucketLevelAccess: metadata.iamConfiguration?.uniformBucketLevelAccess?.enabled ?? null,
          } satisfies BucketMetadataSnapshot;
        },
        catch: cause =>
          new FirebaseStorageInspectError({
            message: "Failed to inspect Firebase Storage bucket metadata.",
            cause,
          }),
      });
    }),
} satisfies FirebaseStorageService);

export class FirebaseStorage extends Effect.Service<FirebaseStorage>()("FirebaseStorage", {
  effect: makeFirebaseStorage,
}) {}

export const FirebaseStorageLive = Layer.effect(
  FirebaseStorage,
  makeFirebaseStorage.pipe(Effect.map(FirebaseStorage.make)),
);
