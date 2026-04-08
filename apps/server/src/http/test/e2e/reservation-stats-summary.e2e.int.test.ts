import type { ReservationsContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("reservation stats summary e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const {
        ReservationAnalyticsRepositoryLive,
        ReservationStatsServiceLive,
      } = await import("@/domain/reservations");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      const reservationAnalyticsLayer = ReservationAnalyticsRepositoryLive.pipe(
        Layer.provide(PrismaLive),
      );
      const reservationStatsLayer = ReservationStatsServiceLive.pipe(
        Layer.provide(reservationAnalyticsLayer),
      );

      return Layer.mergeAll(
        PrismaLive,
        UserDepsLive,
        reservationAnalyticsLayer,
        reservationStatsLayer,
      );
    },
  });

  it("admin can read /v1/reservations/stats/summary", async () => {
    const admin = await fixture.factories.user({ role: "ADMIN" });
    const station = await fixture.factories.station({ name: "Reservation Summary Station" });

    const pendingUserOne = await fixture.factories.user({ role: "USER" });
    const pendingUserTwo = await fixture.factories.user({ role: "USER" });
    const fulfilledUser = await fixture.factories.user({ role: "USER" });
    const cancelledUser = await fixture.factories.user({ role: "USER" });
    const expiredUser = await fixture.factories.user({ role: "USER" });

    await fixture.factories.reservation({
      userId: pendingUserOne.id,
      stationId: station.id,
      status: "PENDING",
    });
    await fixture.factories.reservation({
      userId: pendingUserTwo.id,
      stationId: station.id,
      status: "PENDING",
    });
    await fixture.factories.reservation({
      userId: fulfilledUser.id,
      stationId: station.id,
      status: "FULFILLED",
    });
    await fixture.factories.reservation({
      userId: cancelledUser.id,
      stationId: station.id,
      status: "CANCELLED",
    });
    await fixture.factories.reservation({
      userId: expiredUser.id,
      stationId: station.id,
      status: "EXPIRED",
    });

    const token = fixture.auth.makeAccessToken({ userId: admin.id, role: "ADMIN" });

    const response = await fixture.app.request("http://test/v1/reservations/stats/summary", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json() as ReservationsContracts.ReservationSummaryStatsResponse;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      reservationList: {
        Pending: 2,
        Fulfilled: 1,
        Cancelled: 1,
        Expired: 1,
      },
    });
  });

  it("non-admin gets 403 for /v1/reservations/stats/summary", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });

    const response = await fixture.app.request("http://test/v1/reservations/stats/summary", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(403);
  });

  it("anonymous gets 401 for /v1/reservations/stats/summary", async () => {
    const response = await fixture.app.request("http://test/v1/reservations/stats/summary", {
      method: "GET",
    });

    expect(response.status).toBe(401);
  });
});
