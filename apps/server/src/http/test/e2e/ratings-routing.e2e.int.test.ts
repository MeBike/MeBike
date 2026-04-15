import type { RatingsContracts } from "@mebike/shared";

import { uuidv7 } from "uuidv7";
import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

const ADMIN_ID = "018d4529-6880-77a8-8e6f-4d2c88d22311";
const USER_ID = "018d4529-6880-77a8-8e6f-4d2c88d22312";

describe("ratings routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const { BikeRepositoryLive } = await import("@/domain/bikes/repository/bike.repository");
      const { StationQueryRepositoryLive } = await import("@/domain/stations");
      const { RatingRepositoryLive } = await import("@/domain/ratings/repository/rating.repository");
      const { RatingReasonRepositoryLive } = await import("@/domain/ratings/repository/rating-reason.repository");
      const { RatingServiceLive } = await import("@/domain/ratings/services/rating.service");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      const bikeRepoLayer = BikeRepositoryLive.pipe(Layer.provide(PrismaLive));
      const stationRepoLayer = StationQueryRepositoryLive.pipe(Layer.provide(PrismaLive));
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
        UserDepsLive,
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
          id: ADMIN_ID,
          fullName: "Ratings Admin",
          email: "ratings-admin@example.com",
          passwordHash: "hash123",
          phoneNumber: null,
          username: null,
          avatarUrl: null,
          locationText: null,
          nfcCardUid: null,
          role: "ADMIN",
          accountStatus: "ACTIVE",
          verifyStatus: "VERIFIED",
        },
      });

      await prisma.user.create({
        data: {
          id: USER_ID,
          fullName: "Ratings User",
          email: "ratings-user@example.com",
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

  it("get /v1/admin/ratings lists ratings for admin", async () => {
    const ratedUser = await fixture.factories.user({
      fullname: "Nguyen Van An",
      phoneNumber: "0912345678",
    });
    const station = await fixture.factories.station({
      address: "Pho di bo Nguyen Hue",
      name: "Tram Nguyen Hue, Quan 1",
    });
    const bike = await fixture.factories.bike({
      chipId: "MB-8821",
      stationId: station.id,
    });
    const rental = await fixture.factories.rental({
      bikeId: bike.id,
      endStationId: station.id,
      endTime: new Date("2026-04-04T08:45:00.000Z"),
      startStationId: station.id,
      status: "COMPLETED",
      userId: ratedUser.id,
    });
    const reason = await fixture.prisma.ratingReason.create({
      data: {
        id: uuidv7(),
        type: "ISSUE",
        appliesTo: "bike",
        message: "Phanh hoi yeu",
      },
    });

    await fixture.prisma.rating.create({
      data: {
        id: uuidv7(),
        bikeId: bike.id,
        bikeScore: 4,
        comment: "Xe on nhung khoa hoi cham",
        rentalId: rental.id,
        stationId: station.id,
        stationScore: 5,
        userId: ratedUser.id,
        reasons: {
          create: [{
            reasonId: reason.id,
            target: "bike",
          }],
        },
      },
    });

    const token = fixture.auth.makeAccessToken({ userId: ADMIN_ID, role: "ADMIN" });

    const response = await fixture.app.request("http://test/v1/admin/ratings?page=1&pageSize=20", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json() as RatingsContracts.ListAdminRatingsResponse;

    expect(response.status).toBe(200);
    expect(body.pagination.total).toBe(1);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      bike: {
        chipId: "MB-8821",
      },
      bikeScore: 4,
      comment: "Xe on nhung khoa hoi cham",
      reasons: [
        {
          appliesTo: "bike",
          message: "Phanh hoi yeu",
          type: "ISSUE",
        },
      ],
      station: {
        address: "Pho di bo Nguyen Hue",
        name: "Tram Nguyen Hue, Quan 1",
      },
      stationScore: 5,
      user: {
        fullName: "Nguyen Van An",
        phoneNumber: "0912345678",
      },
    });
  });

  it("get /v1/admin/ratings/{ratingId} returns rating detail for admin", async () => {
    const ratedUser = await fixture.factories.user({
      fullname: "Tran Thi Be",
      phoneNumber: "0901234567",
    });
    const station = await fixture.factories.station({
      address: "45 Le Loi",
      name: "Tram Le Loi",
    });
    const bike = await fixture.factories.bike({
      chipId: "MB-3342",
      stationId: station.id,
    });
    const rental = await fixture.factories.rental({
      bikeId: bike.id,
      endStationId: station.id,
      endTime: new Date("2026-04-03T10:00:00.000Z"),
      startStationId: station.id,
      startTime: new Date("2026-04-03T09:00:00.000Z"),
      status: "COMPLETED",
      userId: ratedUser.id,
    });
    const reason = await fixture.prisma.ratingReason.create({
      data: {
        id: uuidv7(),
        type: "COMPLIMENT",
        appliesTo: "station",
        message: "Nhan vien ho tro nhanh",
      },
    });
    const rating = await fixture.prisma.rating.create({
      data: {
        id: uuidv7(),
        bikeId: bike.id,
        bikeScore: 5,
        comment: "Rat hai long",
        rentalId: rental.id,
        stationId: station.id,
        stationScore: 5,
        userId: ratedUser.id,
        reasons: {
          create: [{
            reasonId: reason.id,
            target: "station",
          }],
        },
      },
    });

    const token = fixture.auth.makeAccessToken({ userId: ADMIN_ID, role: "ADMIN" });

    const response = await fixture.app.request(`http://test/v1/admin/ratings/${rating.id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json() as RatingsContracts.AdminRatingDetailResponse;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      bike: {
        chipId: "MB-3342",
      },
      bikeScore: 5,
      comment: "Rat hai long",
      rental: {
        id: rental.id,
        status: "COMPLETED",
      },
      reasons: [
        {
          appliesTo: "station",
          message: "Nhan vien ho tro nhanh",
          type: "COMPLIMENT",
        },
      ],
      station: {
        address: "45 Le Loi",
        name: "Tram Le Loi",
      },
      stationScore: 5,
      user: {
        fullName: "Tran Thi Be",
        phoneNumber: "0901234567",
      },
    });
  });
});
