import type { FixedSlotTemplatesContracts } from "@mebike/shared";

import { afterEach, describe, expect, it, vi } from "vitest";

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

  afterEach(() => {
    vi.useRealTimers();
  });

  it("user can create fixed-slot template", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    await fixture.factories.wallet({ userId: user.id, balance: 10000n });
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
    expect(created?.pricingPolicyId).toBe("11111111-1111-4111-8111-111111111111");
    expect(created?.subscriptionId).toBeNull();
    expect(created?.prepaid.toString()).toBe("2000");
    expect(created?.dates.map(date => date.slotDate.toISOString().slice(0, 10))).toEqual([
      "2026-04-20",
      "2026-04-22",
    ]);

    const wallet = await fixture.prisma.wallet.findUnique({ where: { userId: user.id } });
    expect(wallet?.balance).toBe(6000n);
  });

  it("rejects a slot that is already today in Vietnam even if UTC is still previous day", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-19T18:00:00.000Z"));

    const user = await fixture.factories.user({ role: "USER" });
    await fixture.factories.wallet({ userId: user.id, balance: 10000n });
    const station = await fixture.factories.station({ name: "Vietnam Today Station" });
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
        slotDates: ["2026-04-20"],
      }),
    });

    const body = await response.json() as FixedSlotTemplatesContracts.FixedSlotTemplateErrorResponse;

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Fixed-slot dates must be in the future",
      details: {
        code: "FIXED_SLOT_DATE_NOT_FUTURE",
        slotDate: "2026-04-20",
      },
    });
  });

  it("uses current subscription upfront when enough usages remain", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    await fixture.factories.wallet({ userId: user.id, balance: 10000n });
    const station = await fixture.factories.station({ name: "Subscription Station" });
    const subscription = await fixture.factories.subscription({
      userId: user.id,
      status: "ACTIVE",
      maxUsages: 5,
      usageCount: 1,
    });
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

    const created = await fixture.prisma.fixedSlotTemplate.findUnique({ where: { id: body.id } });
    const wallet = await fixture.prisma.wallet.findUnique({ where: { userId: user.id } });
    const updatedSubscription = await fixture.prisma.subscription.findUnique({ where: { id: subscription.id } });

    expect(created?.subscriptionId).toBe(subscription.id);
    expect(created?.prepaid.toString()).toBe("0");
    expect(wallet?.balance).toBe(10000n);
    expect(updatedSubscription?.usageCount).toBe(3);
  });

  it("rejects fixed-slot create when wallet balance is insufficient", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    await fixture.factories.wallet({ userId: user.id, balance: 3000n });
    const station = await fixture.factories.station({ name: "Low Balance Station" });
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

    const body = await response.json() as FixedSlotTemplatesContracts.FixedSlotTemplateErrorResponse;

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "Insufficient balance for fixed-slot upfront payment",
      details: {
        code: "FIXED_SLOT_INSUFFICIENT_BALANCE",
        balance: "3000",
        requiredAmount: "4000",
      },
    });
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

  it("user can update fixed-slot template by adding dates with extra upfront charge", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    await fixture.factories.wallet({ userId: user.id, balance: 10000n });
    const station = await fixture.factories.station({ name: "Update Station" });
    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });

    const createResponse = await fixture.app.request("http://test/v1/fixed-slot-templates", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stationId: station.id,
        slotStart: "09:30",
        slotDates: ["2026-04-20"],
      }),
    });
    const created = await createResponse.json() as FixedSlotTemplatesContracts.CreateFixedSlotTemplateResponse;

    const updateResponse = await fixture.app.request(`http://test/v1/fixed-slot-templates/${created.id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slotDates: ["2026-04-20", "2026-04-22"],
      }),
    });

    const body = await updateResponse.json() as FixedSlotTemplatesContracts.UpdateFixedSlotTemplateResponse;
    const wallet = await fixture.prisma.wallet.findUnique({ where: { userId: user.id } });
    const updated = await fixture.prisma.fixedSlotTemplate.findUnique({
      where: { id: created.id },
      include: { dates: { orderBy: { slotDate: "asc" } } },
    });

    expect(updateResponse.status).toBe(200);
    expect(body.slotDates).toEqual(["2026-04-20", "2026-04-22"]);
    expect(wallet?.balance).toBe(6000n);
    expect(updated?.dates.map(date => ({
      slotDate: date.slotDate.toISOString().slice(0, 10),
      pricingPolicyId: date.pricingPolicyId,
      subscriptionId: date.subscriptionId,
      prepaid: date.prepaid?.toString() ?? null,
    }))).toEqual([
      {
        slotDate: "2026-04-20",
        pricingPolicyId: "11111111-1111-4111-8111-111111111111",
        subscriptionId: null,
        prepaid: "2000",
      },
      {
        slotDate: "2026-04-22",
        pricingPolicyId: "11111111-1111-4111-8111-111111111111",
        subscriptionId: null,
        prepaid: "2000",
      },
    ]);
  });

  it("user can update fixed-slot slot start and linked pending reservations", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    const station = await fixture.factories.station({ name: "Shift Station" });
    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });

    const template = await fixture.prisma.fixedSlotTemplate.create({
      data: {
        userId: user.id,
        stationId: station.id,
        pricingPolicyId: "11111111-1111-4111-8111-111111111111",
        slotStart: new Date(Date.UTC(2000, 0, 1, 9, 30, 0)),
        prepaid: "2000",
        status: "ACTIVE",
        updatedAt: new Date("2026-04-10T10:00:00.000Z"),
        dates: {
          create: [{ slotDate: new Date(Date.UTC(2026, 3, 20)) }],
        },
      },
    });
    const reservation = await fixture.factories.reservation({
      userId: user.id,
      stationId: station.id,
      fixedSlotTemplateId: template.id,
      reservationOption: "FIXED_SLOT",
      startTime: new Date("2026-04-20T02:30:00.000Z"),
      status: "PENDING",
    });

    const response = await fixture.app.request(`http://test/v1/fixed-slot-templates/${template.id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slotStart: "10:45",
      }),
    });

    const body = await response.json() as FixedSlotTemplatesContracts.UpdateFixedSlotTemplateResponse;
    const updatedReservation = await fixture.prisma.reservation.findUnique({ where: { id: reservation.id } });

    expect(response.status).toBe(200);
    expect(body.slotStart).toBe("10:45");
    expect(updatedReservation?.startTime.toISOString()).toBe("2026-04-20T03:45:00.000Z");
  });

  it("user can remove one fixed-slot date without refund", async () => {
    const user = await fixture.factories.user({ role: "USER" });
    await fixture.factories.wallet({ userId: user.id, balance: 10000n });
    const station = await fixture.factories.station({ name: "Skip Date Station" });
    const removedBike = await fixture.factories.bike({ stationId: station.id, status: "RESERVED" });
    const token = fixture.auth.makeAccessToken({ userId: user.id, role: "USER" });

    const createResponse = await fixture.app.request("http://test/v1/fixed-slot-templates", {
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
    const created = await createResponse.json() as FixedSlotTemplatesContracts.CreateFixedSlotTemplateResponse;

    const removedReservation = await fixture.factories.reservation({
      userId: user.id,
      bikeId: removedBike.id,
      stationId: station.id,
      fixedSlotTemplateId: created.id,
      reservationOption: "FIXED_SLOT",
      startTime: new Date("2026-04-22T02:30:00.000Z"),
      status: "PENDING",
    });

    const response = await fixture.app.request(
      `http://test/v1/fixed-slot-templates/${created.id}/dates/2026-04-22`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const body = await response.json() as FixedSlotTemplatesContracts.FixedSlotTemplate;
    const wallet = await fixture.prisma.wallet.findUnique({ where: { userId: user.id } });
    const updatedRemovedReservation = await fixture.prisma.reservation.findUnique({ where: { id: removedReservation.id } });
    const updatedRemovedBike = await fixture.prisma.bike.findUnique({ where: { id: removedBike.id } });

    expect(response.status).toBe(200);
    expect(body.slotDates).toEqual(["2026-04-20"]);
    expect(wallet?.balance).toBe(6000n);
    expect(updatedRemovedReservation?.status).toBe("CANCELLED");
    expect(updatedRemovedBike?.status).toBe("AVAILABLE");
  });
});
