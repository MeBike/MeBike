import { Layer } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { BikeRepository } from "@/domain/bikes";
import { toPrismaDecimal } from "@/domain/shared/decimal";
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
    const station = await fixture.factories.station({ name: "Fixed Slot Station" });
    const bike = await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    const template = await fixture.prisma.fixedSlotTemplate.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        stationId: station.id,
        pricingPolicyId: "11111111-1111-4111-8111-111111111111",
        subscriptionId: null,
        prepaid: toPrismaDecimal("2000"),
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
    const station = await fixture.factories.station({ name: "Fixed Slot Timezone Station" });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    const template = await fixture.prisma.fixedSlotTemplate.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        stationId: station.id,
        pricingPolicyId: "11111111-1111-4111-8111-111111111111",
        subscriptionId: null,
        prepaid: toPrismaDecimal("2000"),
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
    const station = await fixture.factories.station({ name: "Fixed Slot Rerun Station" });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });

    const template = await fixture.prisma.fixedSlotTemplate.create({
      data: {
        id: uuidv7(),
        userId: user.id,
        stationId: station.id,
        pricingPolicyId: "11111111-1111-4111-8111-111111111111",
        subscriptionId: null,
        prepaid: toPrismaDecimal("2000"),
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
  });
});
