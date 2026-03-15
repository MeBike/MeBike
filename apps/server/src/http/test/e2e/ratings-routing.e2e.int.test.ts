import type { RatingsContracts } from "@mebike/shared";
import type { Kysely } from "kysely";

import jwt from "jsonwebtoken";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { DB } from "generated/kysely/types";

import { destroyTestDb, makeTestDb } from "@/test/db/kysely";
import { seed } from "@/test/db/seed";
import { getTestDatabase } from "@/test/db/test-database";

const USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22312";

type RuntimeLike = {
  runPromise: <A>(effect: unknown) => Promise<A>;
  dispose?: () => Promise<void>;
};

type TestAppLike = {
  request: (input: string | URL | Request, init?: RequestInit) => Response | Promise<Response>;
};

describe("ratings routing e2e", () => {
  let container: { stop: () => Promise<void>; url: string };
  let testDb: Kysely<DB>;
  let app: TestAppLike;
  let runtime: RuntimeLike;

  beforeAll(async () => {
    container = await getTestDatabase();
    testDb = makeTestDb(container.url);
    await seed(testDb);

    await testDb
      .insertInto("User")
      .values({
        id: USER_ID,
        fullname: "Ratings User",
        email: "ratings-user@example.com",
        password_hash: "hash123",
        phone_number: null,
        username: null,
        avatar: null,
        location: null,
        nfc_card_uid: null,
        role: "USER",
        verify: "VERIFIED",
        updated_at: new Date("2024-01-12T10:00:00Z"),
      })
      .execute();

    process.env.DATABASE_URL = container.url;
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? "secret";

    vi.resetModules();

    const { Layer, ManagedRuntime } = await import("effect");
    const { createHttpApp } = await import("@/http/app");
    const { PrismaLive } = await import("@/infrastructure/prisma");
    const { UserRepositoryLive } = await import("@/domain/users/repository/user.repository");
    const { UserServiceLive } = await import("@/domain/users/services/user.service");
    const { BikeRepositoryLive } = await import("@/domain/bikes/repository/bike.repository");
    const { StationRepositoryLive } = await import("@/domain/stations/repository/station.repository");
    const { RatingRepositoryLive } = await import("@/domain/ratings/repository/rating.repository");
    const { RatingReasonRepositoryLive } = await import("@/domain/ratings/repository/rating-reason.repository");
    const { RatingServiceLive } = await import("@/domain/ratings/services/rating.service");

    const userRepoLayer = UserRepositoryLive.pipe(Layer.provide(PrismaLive));
    const userServiceLayer = UserServiceLive.pipe(Layer.provide(userRepoLayer));
    const bikeRepoLayer = BikeRepositoryLive.pipe(Layer.provide(PrismaLive));
    const stationRepoLayer = StationRepositoryLive.pipe(Layer.provide(PrismaLive));
    const ratingReposLayer = Layer.mergeAll(
      RatingRepositoryLive,
      RatingReasonRepositoryLive,
    ).pipe(Layer.provide(PrismaLive));
    const ratingServiceLayer = RatingServiceLive.pipe(
      Layer.provide(ratingReposLayer),
      Layer.provide(bikeRepoLayer),
      Layer.provide(stationRepoLayer),
    );

    const httpTestLayer = Layer.mergeAll(
      userRepoLayer,
      userServiceLayer,
      bikeRepoLayer,
      stationRepoLayer,
      ratingReposLayer,
      ratingServiceLayer,
      PrismaLive,
    );

    runtime = ManagedRuntime.make(httpTestLayer) as RuntimeLike;

    app = createHttpApp({
      runPromise: runtime.runPromise as never,
    });
  }, 60000);

  afterAll(async () => {
    if (runtime?.dispose) {
      await runtime.dispose();
    }

    const databaseModule = await import("@/database");
    await databaseModule.db.destroy();

    if (testDb) {
      await destroyTestDb(testDb);
    }
    if (container) {
      await container.stop();
    }
  });

  function makeAccessToken(userId: string) {
    return jwt.sign(
      {
        userId,
        tokenType: "access",
      },
      process.env.JWT_SECRET ?? "secret",
      { algorithm: "HS256", expiresIn: "10m" },
    );
  }

  it("get /v1/ratings/bikes/{bikeId}/summary resolves bike summary route", async () => {
    const token = makeAccessToken(USER_ID);
    const bikeId = "018d4529-6880-77a8-8e6f-4d2c88d22313";

    const response = await app.request(`http://test/v1/ratings/bikes/${bikeId}/summary`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json() as RatingsContracts.RatingSummaryErrorResponse;

    expect(response.status).toBe(404);
    expect(body.details.code).toBe("BIKE_NOT_FOUND");
  });

  it("get /v1/ratings/stations/{stationId}/summary resolves station summary route", async () => {
    const token = makeAccessToken(USER_ID);
    const stationId = "018d4529-6880-77a8-8e6f-4d2c88d22314";

    const response = await app.request(`http://test/v1/ratings/stations/${stationId}/summary`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json() as RatingsContracts.RatingSummaryErrorResponse;

    expect(response.status).toBe(404);
    expect(body.details.code).toBe("STATION_NOT_FOUND");
  });
});
