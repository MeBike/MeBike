import type { FixedSlotTemplatesContracts } from "@mebike/shared";

import { describe, expect, it } from "vitest";

import { setupHttpE2eFixture } from "@/test/http/e2e-fixture";

describe("fixed-slot templates routing e2e", () => {
  const fixture = setupHttpE2eFixture({
    buildLayer: async () => {
      const { Layer } = await import("effect");
      const { PrismaLive } = await import("@/infrastructure/prisma");
      const { ReservationDepsLive } = await import("@/http/shared/features/reservation.layers");
      const { UserDepsLive } = await import("@/http/shared/features/user.layers");

      return Layer.mergeAll(
        PrismaLive,
        ReservationDepsLive,
        UserDepsLive,
      );
    },
  });

  it("user can create fixed-slot template", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    const station = await fixture.factories.station({ name: "Fixed Slot Station" });
    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });

    const response = await fixture.app.request("http://test/v1/fixed-slot-templates", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stationId: station.id,
        slotStart: "09:30",
        slotDates: ["2026-04-20", "2026-04-22"],
      }),
    });

    const body = await response.json() as FixedSlotTemplatesContracts.CreateFixedSlotTemplateResponse;

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      userId: user.id,
      station: {
        id: station.id,
        name: "Fixed Slot Station",
      },
      slotStart: "09:30",
      slotDates: ["2026-04-20", "2026-04-22"],
      status: "ACTIVE",
    });

    const created = await fixture.prisma.fixedSlotTemplate.findUnique({
      where: { id: body.id },
      include: { dates: { orderBy: { slotDate: "asc" } } },
    });
    expect(created?.userId).toBe(user.id);
    expect(created?.stationId).toBe(station.id);
    expect(created?.dates.map(date => date.slotDate.toISOString().slice(0, 10))).toEqual([
      "2026-04-20",
      "2026-04-22",
    ]);
  });

  it("user can list own fixed-slot templates with filters", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    const otherUser = await fixture.factories.user({ role: "USER" });
    const stationA = await fixture.factories.station({ name: "Station A" });
    const stationB = await fixture.factories.station({ name: "Station B" });
    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });

    const first = await fixture.prisma.fixedSlotTemplate.create({
      data: {
        userId: user.id,
        stationId: stationA.id,
        slotStart: new Date(Date.UTC(2000, 0, 1, 9, 30, 0)),
        status: "ACTIVE",
        updatedAt: new Date("2026-04-10T10:00:00.000Z"),
        dates: {
          create: [{ slotDate: new Date(Date.UTC(2026, 3, 20)) }],
        },
      },
    });
    await fixture.prisma.fixedSlotTemplate.create({
      data: {
        userId: user.id,
        stationId: stationB.id,
        slotStart: new Date(Date.UTC(2000, 0, 1, 10, 0, 0)),
        status: "CANCELLED",
        updatedAt: new Date("2026-04-11T10:00:00.000Z"),
        dates: {
          create: [{ slotDate: new Date(Date.UTC(2026, 3, 21)) }],
        },
      },
    });
    await fixture.prisma.fixedSlotTemplate.create({
      data: {
        userId: otherUser.id,
        stationId: stationA.id,
        slotStart: new Date(Date.UTC(2000, 0, 1, 11, 0, 0)),
        status: "ACTIVE",
        updatedAt: new Date("2026-04-12T10:00:00.000Z"),
        dates: {
          create: [{ slotDate: new Date(Date.UTC(2026, 3, 22)) }],
        },
      },
    });

    const response = await fixture.app.request(
      `http://test/v1/fixed-slot-templates?status=ACTIVE&stationId=${stationA.id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const body = await response.json() as FixedSlotTemplatesContracts.ListFixedSlotTemplatesResponse;

    expect(response.status).toBe(200);
    expect(body.pagination.total).toBe(1);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      id: first.id,
      userId: user.id,
      station: {
        id: stationA.id,
        name: "Station A",
      },
      slotStart: "09:30",
      slotDates: ["2026-04-20"],
      status: "ACTIVE",
    });
  });

  it("rejects duplicate active template at same user/date/time", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    const station = await fixture.factories.station({ name: "Conflict Station" });
    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });

    await fixture.prisma.fixedSlotTemplate.create({
      data: {
        userId: user.id,
        stationId: station.id,
        slotStart: new Date(Date.UTC(2000, 0, 1, 9, 30, 0)),
        status: "ACTIVE",
        updatedAt: new Date("2026-04-10T10:00:00.000Z"),
        dates: {
          create: [{ slotDate: new Date(Date.UTC(2026, 3, 20)) }],
        },
      },
    });

    const response = await fixture.app.request("http://test/v1/fixed-slot-templates", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stationId: station.id,
        slotStart: "09:30",
        slotDates: ["2026-04-20", "2026-04-21"],
      }),
    });

    const body = await response.json() as FixedSlotTemplatesContracts.FixedSlotTemplateErrorResponse;

    expect(response.status).toBe(409);
    expect(body).toEqual({
      error: "An active fixed-slot template already exists for one or more selected dates at this time",
      details: {
        code: "FIXED_SLOT_TEMPLATE_CONFLICT",
        slotStart: "09:30",
        slotDates: ["2026-04-20", "2026-04-21"],
      },
    });
  });

  it("user can get own fixed-slot template detail", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    const station = await fixture.factories.station({ name: "Detail Station" });
    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });

    const template = await fixture.prisma.fixedSlotTemplate.create({
      data: {
        userId: user.id,
        stationId: station.id,
        slotStart: new Date(Date.UTC(2000, 0, 1, 14, 15, 0)),
        status: "ACTIVE",
        updatedAt: new Date("2026-04-10T10:00:00.000Z"),
        dates: {
          create: [
            { slotDate: new Date(Date.UTC(2026, 3, 20)) },
            { slotDate: new Date(Date.UTC(2026, 3, 21)) },
          ],
        },
      },
    });

    const response = await fixture.app.request(`http://test/v1/fixed-slot-templates/${template.id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await response.json() as FixedSlotTemplatesContracts.FixedSlotTemplate;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      id: template.id,
      userId: user.id,
      station: {
        id: station.id,
        name: "Detail Station",
      },
      slotStart: "14:15",
      slotDates: ["2026-04-20", "2026-04-21"],
      status: "ACTIVE",
    });
  });

  it("user can cancel fixed-slot template and linked pending reservations", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    const station = await fixture.factories.station({ name: "Cancel Station" });
    const bike = await fixture.factories.bike({ stationId: station.id, status: "RESERVED" });
    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });

    const template = await fixture.prisma.fixedSlotTemplate.create({
      data: {
        userId: user.id,
        stationId: station.id,
        slotStart: new Date(Date.UTC(2000, 0, 1, 9, 30, 0)),
        status: "ACTIVE",
        updatedAt: new Date("2026-04-10T10:00:00.000Z"),
        dates: {
          create: [{ slotDate: new Date(Date.UTC(2026, 3, 20)) }],
        },
      },
    });
    const reservation = await fixture.factories.reservation({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      fixedSlotTemplateId: template.id,
      reservationOption: "FIXED_SLOT",
      startTime: new Date("2026-04-20T09:30:00.000Z"),
      status: "PENDING",
    });

    const response = await fixture.app.request(
      `http://test/v1/fixed-slot-templates/${template.id}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const body = await response.json() as FixedSlotTemplatesContracts.FixedSlotTemplate;

    expect(response.status).toBe(200);
    expect(body.status).toBe("CANCELLED");

    const updatedTemplate = await fixture.prisma.fixedSlotTemplate.findUnique({ where: { id: template.id } });
    const updatedReservation = await fixture.prisma.reservation.findUnique({ where: { id: reservation.id } });
    const updatedBike = await fixture.prisma.bike.findUnique({ where: { id: bike.id } });

    expect(updatedTemplate?.status).toBe("CANCELLED");
    expect(updatedReservation?.status).toBe("CANCELLED");
    expect(updatedBike?.status).toBe("AVAILABLE");
  });
});
