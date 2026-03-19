import type { RatingsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22312";

describe("ratings routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
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

      return Layer.mergeAll(
        userRepoLayer,
        userServiceLayer,
        bikeRepoLayer,
        stationRepoLayer,
        ratingReposLayer,
        ratingServiceLayer,
        PrismaLive,
      );
    },
    seedData: async (_db, prisma) => {
      await prisma.user.create({
        data: {
          id: USER_ID,
          fullname: "Ratings User",
          email: "ratings-user@example.com",
          passwordHash: "hash123",
          phoneNumber: null,
          username: null,
          avatar: null,
          location: null,
          nfcCardUid: null,
          role: "USER",
          verify: "VERIFIED",
        },
      });
    },
  });

  it("get /v1/ratings/bikes/{bikeId}/summary resolves bike summary route", async () => {
    const token = fixture.auth.makeAccessToken({ userId: USER_ID, role: "USER" });
    const bikeId = "018d4529-6880-77a8-8e6f-4d2c88d22313";

    const response = await fixture.app.request(`http://test/v1/ratings/bikes/${bikeId}/summary`, {
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
    const token = fixture.auth.makeAccessToken({ userId: USER_ID, role: "USER" });
    const stationId = "018d4529-6880-77a8-8e6f-4d2c88d22314";

    const response = await fixture.app.request(`http://test/v1/ratings/stations/${stationId}/summary`, {
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
