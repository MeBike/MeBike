import { Layer } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { BikeRepository } from "@/domain/bikes";
import { Prisma } from "@/infrastructure/prisma";
import { runEffectWithLayer } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { assignFixedSlotReservations } from "../fixed-slot/fixed-slot.service";

describe("assignFixedSlotReservations integration", () => {
  const fixture = setupPrismaIntFixture();
  let layer: Layer.Layer<Prisma | BikeRepository, never, never>;

  beforeAll(() => {
    layer = Layer.mergeAll(
      Layer.succeed(Prisma, Prisma.make({ client: fixture.prisma as never })),
      Layer.succeed(BikeRepository, BikeRepository.make({} as never)),
    );
  });

  it("creates and assigns a daily fixed-slot reservation", async () => {
    const slotDate = new Date(Date.UTC(2026, 3, 14));
    const slotStart = new Date(Date.UTC(2000, 0, 1, 9, 0, 0));
    const user = await fixture.factories.user({ fullname: "Fixed Slot User" });
    await fixture.factories.wallet({ userId: user.id, balance: 10000n });
    const station = await fixture.factories.station({ name: "Fixed Slot Station", capacity: 2 });
    const bike = await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    const template = await fixture.prisma.fixedSlotTemplate.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        stationId: station.id,
        slotStart,
        status: "ACTIVE",
        updatedAt: new Date(),
        dates: {
          create: [{ id: uuidv7(), slotDate }],
        },
      },
      select: { id: true },
    });

    const summary = await runEffectWithLayer(
      assignFixedSlotReservations({ slotDate, assignmentTime: slotDate, now: slotDate }),
      layer,
    );

    expect(summary).toMatchObject({
      totalTemplates: 1,
      assigned: 1,
      alreadyAssigned: 0,
      noBike: 0,
      conflicts: 0,
    });

    const reservation = await fixture.prisma.reservation.findFirst({
      where: {
        fixedSlotTemplateId: template.id,
        reservationOption: "FIXED_SLOT",
        startTime: new Date(Date.UTC(2026, 3, 14, 2, 0, 0)),
      },
    });

    expect(reservation).not.toBeNull();
    expect(reservation?.userId).toBe(user.id);
    expect(reservation?.bikeId).toBe(bike.id);
    expect(reservation?.stationId).toBe(station.id);
    expect(reservation?.endTime).toBeNull();
    expect(reservation?.pricingPolicyId).toBe("11111111-1111-4111-8111-111111111111");
    expect(reservation?.subscriptionId).toBeNull();
    expect(reservation?.prepaid.toString()).toBe("2000");

    const wallet = await fixture.prisma.wallet.findUnique({ where: { userId: user.id } });
    expect(wallet?.balance).toBe(8000n);

    const updatedBike = await fixture.prisma.bike.findUnique({ where: { id: bike.id } });
    expect(updatedBike?.status).toBe("RESERVED");

    const outbox = await fixture.prisma.jobOutbox.findMany({
      where: { dedupeKey: `fixed-slot:assigned:${reservation!.id}` },
    });
    expect(outbox).toHaveLength(1);
  });

  it("stores fixed-slot start time as the UTC instant for Vietnam local time", async () => {
    const slotDate = new Date(Date.UTC(2026, 3, 20));
    const slotStart = new Date(Date.UTC(2000, 0, 1, 9, 30, 0));
    const user = await fixture.factories.user({ fullname: "Fixed Slot Timezone User" });
    await fixture.factories.wallet({ userId: user.id, balance: 10000n });
    const station = await fixture.factories.station({ name: "Fixed Slot Timezone Station", capacity: 2 });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    const template = await fixture.prisma.fixedSlotTemplate.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        stationId: station.id,
        slotStart,
        status: "ACTIVE",
        updatedAt: new Date(),
        dates: {
          create: [{ id: uuidv7(), slotDate }],
        },
      },
      select: { id: true },
    });

    await runEffectWithLayer(
      assignFixedSlotReservations({ slotDate, assignmentTime: slotDate, now: slotDate }),
      layer,
    );

    const reservation = await fixture.prisma.reservation.findFirst({
      where: {
        fixedSlotTemplateId: template.id,
        reservationOption: "FIXED_SLOT",
      },
    });

    expect(reservation).not.toBeNull();
    expect(reservation?.startTime.toISOString()).toBe("2026-04-20T02:30:00.000Z");
    expect(reservation?.startTime.toLocaleString("en-GB", { timeZone: "Asia/Ho_Chi_Minh" })).toContain("09:30:00");
  });

  it("treats rerun as already assigned and keeps one daily reservation", async () => {
    const slotDate = new Date(Date.UTC(2026, 3, 15));
    const slotStart = new Date(Date.UTC(2000, 0, 1, 10, 30, 0));
    const user = await fixture.factories.user({ fullname: "Fixed Slot Rerun User" });
    await fixture.factories.wallet({ userId: user.id, balance: 10000n });
    const station = await fixture.factories.station({ name: "Fixed Slot Rerun Station", capacity: 2 });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    const template = await fixture.prisma.fixedSlotTemplate.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        stationId: station.id,
        slotStart,
        status: "ACTIVE",
        updatedAt: new Date(),
        dates: {
          create: [{ id: uuidv7(), slotDate }],
        },
      },
      select: { id: true },
    });

    const firstSummary = await runEffectWithLayer(
      assignFixedSlotReservations({ slotDate, assignmentTime: slotDate, now: slotDate }),
      layer,
    );
    const secondSummary = await runEffectWithLayer(
      assignFixedSlotReservations({ slotDate, assignmentTime: slotDate, now: slotDate }),
      layer,
    );

    expect(firstSummary.assigned).toBe(1);
    expect(secondSummary).toMatchObject({
      totalTemplates: 1,
      assigned: 0,
      alreadyAssigned: 1,
      billingFailed: 0,
      noBike: 0,
      conflicts: 0,
    });

    const reservations = await fixture.prisma.reservation.findMany({
      where: {
        fixedSlotTemplateId: template.id,
        reservationOption: "FIXED_SLOT",
        startTime: new Date(Date.UTC(2026, 3, 15, 3, 30, 0)),
      },
    });
    expect(reservations).toHaveLength(1);

    const wallet = await fixture.prisma.wallet.findUnique({ where: { userId: user.id } });
    expect(wallet?.balance).toBe(8000n);
  });

  it("uses current subscription when worker materializes reservation", async () => {
    const slotDate = new Date(Date.UTC(2026, 3, 16));
    const slotStart = new Date(Date.UTC(2000, 0, 1, 8, 45, 0));
    const user = await fixture.factories.user({ fullname: "Fixed Slot Subscription User" });
    await fixture.factories.wallet({ userId: user.id, balance: 10000n });
    const subscription = await fixture.factories.subscription({
      userId: user.id,
      status: "ACTIVE",
      maxUsages: 3,
      usageCount: 1,
    });
    const station = await fixture.factories.station({ name: "Fixed Slot Subscription Station", capacity: 2 });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    const template = await fixture.prisma.fixedSlotTemplate.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        stationId: station.id,
        slotStart,
        status: "ACTIVE",
        updatedAt: new Date(),
        dates: {
          create: [{ id: uuidv7(), slotDate }],
        },
      },
      select: { id: true },
    });

    const summary = await runEffectWithLayer(
      assignFixedSlotReservations({ slotDate, assignmentTime: slotDate, now: slotDate }),
      layer,
    );

    expect(summary).toMatchObject({
      totalTemplates: 1,
      assigned: 1,
      alreadyAssigned: 0,
      billingFailed: 0,
      noBike: 0,
      conflicts: 0,
    });

    const reservation = await fixture.prisma.reservation.findFirst({
      where: {
        fixedSlotTemplateId: template.id,
        reservationOption: "FIXED_SLOT",
      },
    });
    expect(reservation?.subscriptionId).toBe(subscription.id);
    expect(reservation?.prepaid.toString()).toBe("0");

    const wallet = await fixture.prisma.wallet.findUnique({ where: { userId: user.id } });
    const updatedSubscription = await fixture.prisma.subscription.findUnique({ where: { id: subscription.id } });
    expect(wallet?.balance).toBe(10000n);
    expect(updatedSubscription?.usageCount).toBe(2);
  });

  it("marks billing failure when worker cannot charge the user", async () => {
    const slotDate = new Date(Date.UTC(2026, 3, 17));
    const slotStart = new Date(Date.UTC(2000, 0, 1, 7, 30, 0));
    const user = await fixture.factories.user({ fullname: "Fixed Slot Low Balance User" });
    await fixture.factories.wallet({ userId: user.id, balance: 1000n });
    const station = await fixture.factories.station({ name: "Fixed Slot Low Balance Station", capacity: 2 });
    const bike = await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    const template = await fixture.prisma.fixedSlotTemplate.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        stationId: station.id,
        slotStart,
        status: "ACTIVE",
        updatedAt: new Date(),
        dates: {
          create: [{ id: uuidv7(), slotDate }],
        },
      },
      select: { id: true },
    });

    const summary = await runEffectWithLayer(
      assignFixedSlotReservations({ slotDate, assignmentTime: slotDate, now: slotDate }),
      layer,
    );

    expect(summary).toMatchObject({
      totalTemplates: 1,
      assigned: 0,
      alreadyAssigned: 0,
      billingFailed: 1,
      noBike: 0,
      conflicts: 0,
    });

    const reservation = await fixture.prisma.reservation.findFirst({
      where: {
        fixedSlotTemplateId: template.id,
        reservationOption: "FIXED_SLOT",
      },
    });
    expect(reservation).toBeNull();

    const wallet = await fixture.prisma.wallet.findUnique({ where: { userId: user.id } });
    const updatedBike = await fixture.prisma.bike.findUnique({ where: { id: bike.id } });
    const outbox = await fixture.prisma.jobOutbox.findMany({
      where: { dedupeKey: `fixed-slot:billing-failed:${template.id}:2026-04-17` },
    });
    expect(wallet?.balance).toBe(1000n);
    expect(updatedBike?.status).toBe("AVAILABLE");
    expect(outbox).toHaveLength(1);
  });
});
