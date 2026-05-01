import { Effect, Layer } from "effect";
import { uuidv7 } from "uuidv7";
import { describe, expect, it } from "vitest";

import type {
  PricingPolicyAlreadyUsed,
  PricingPolicyInvalidInput,
  PricingPolicyMutationWindowClosed,
  PricingPolicyNotFound,
} from "@/domain/pricing/domain-errors";

import { toPrismaDecimal } from "@/domain/shared/decimal";
import { Prisma } from "@/infrastructure/prisma";
import { expectLeftTag, expectRight } from "@/test/effect/assertions";
import { runEffectEitherWithLayer } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import {
  makePricingPolicyCommandRepository,
  makePricingPolicyQueryRepository,
  PricingPolicyCommandRepository,
  PricingPolicyCommandServiceLive,
  PricingPolicyCommandServiceTag,
  PricingPolicyQueryRepository,
  PricingPolicyQueryServiceLive,
  PricingPolicyQueryServiceTag,
} from "../..";

describe("pricing policy service integration", () => {
  const fixture = setupPrismaIntFixture();

  function makeLayer() {
    const queryRepo = makePricingPolicyQueryRepository(fixture.prisma);
    const commandRepo = makePricingPolicyCommandRepository(fixture.prisma);
    const infraLayer = Layer.mergeAll(
      Layer.succeed(Prisma, Prisma.make({ client: fixture.prisma })),
      Layer.succeed(
        PricingPolicyQueryRepository,
        PricingPolicyQueryRepository.make(queryRepo),
      ),
      Layer.succeed(
        PricingPolicyCommandRepository,
        PricingPolicyCommandRepository.make(commandRepo),
      ),
    );

    return Layer.mergeAll(
      Layer.provide(PricingPolicyQueryServiceLive, infraLayer),
      Layer.provide(PricingPolicyCommandServiceLive, infraLayer),
    );
  }

  function runCommand<A, E>(
    factory: (service: InstanceType<typeof PricingPolicyCommandServiceTag>) => Effect.Effect<A, E>,
  ) {
    return runEffectEitherWithLayer(
      Effect.gen(function* () {
        const service = yield* PricingPolicyCommandServiceTag;
        return yield* factory(service);
      }),
      makeLayer(),
    );
  }

  function runQuery<A, E>(
    factory: (service: InstanceType<typeof PricingPolicyQueryServiceTag>) => Effect.Effect<A, E>,
  ) {
    return runEffectEitherWithLayer(
      Effect.gen(function* () {
        const service = yield* PricingPolicyQueryServiceTag;
        return yield* factory(service);
      }),
      makeLayer(),
    );
  }

  it("returns the seeded active policy from query service", async () => {
    const result = await runQuery(service => service.getActive());

    const policy = expectRight(result);
    expect(policy.name).toBe("Default Pricing Policy");
    expect(policy.status).toBe("ACTIVE");
  });

  it("allows policy creation outside overnight mutation window", async () => {
    const result = await runCommand(service => service.createPolicy({
      name: "Daytime Policy",
      baseRate: 2200n,
      billingUnitMinutes: 30,
      reservationFee: 2000n,
      depositRequired: 500000n,
      lateReturnCutoff: new Date("1970-01-01T23:00:00.000Z"),
      now: new Date("2026-04-20T15:00:00.000Z"),
    }));

    const policy = expectRight(result);
    expect(policy.name).toBe("Daytime Policy");
    expect(policy.status).toBe("INACTIVE");
  });

  it("rejects create when money fields are below practical VND minimum", async () => {
    const result = await runCommand(service => service.createPolicy({
      name: "Too Cheap Policy",
      baseRate: 1n,
      billingUnitMinutes: 30,
      reservationFee: 1n,
      depositRequired: 1n,
      lateReturnCutoff: new Date("1970-01-01T23:00:00.000Z"),
    }));

    const error = expectLeftTag(result, "PricingPolicyInvalidInput") as PricingPolicyInvalidInput;
    expect(error.issues.map(issue => issue.path)).toEqual([
      "baseRate",
      "reservationFee",
      "depositRequired",
    ]);
  });

  it("returns not found when updating a nonexistent policy", async () => {
    const missingId = uuidv7();

    const result = await runCommand(service => service.updatePolicy({
      pricingPolicyId: missingId,
      name: "Missing Policy",
      now: new Date("2026-04-20T16:45:00.000Z"),
    }));

    const error = expectLeftTag(result, "PricingPolicyNotFound") as PricingPolicyNotFound;
    expect(error.pricingPolicyId).toBe(missingId);
  });

  it("creates an inactive draft during overnight mutation window", async () => {
    const result = await runCommand(service => service.createPolicy({
      name: "  Night Draft Policy  ",
      baseRate: 2200n,
      billingUnitMinutes: 45,
      reservationFee: 2500n,
      depositRequired: 550000n,
      lateReturnCutoff: new Date("1970-01-01T23:00:00.000Z"),
      now: new Date("2026-04-20T16:30:00.000Z"),
    }));

    const policy = expectRight(result);
    expect(policy.name).toBe("Night Draft Policy");
    expect(policy.status).toBe("INACTIVE");
    expect(policy.billingUnitMinutes).toBe(45);
  });

  it("allows updating an unused policy outside overnight mutation window", async () => {
    const policy = await fixture.factories.pricingPolicy({
      name: "Unused Policy",
      status: "INACTIVE",
    });

    const result = await runCommand(service => service.updatePolicy({
      pricingPolicyId: policy.id,
      name: "  Renamed Policy  ",
      baseRate: 2800n,
      billingUnitMinutes: 60,
      reservationFee: 3000n,
      depositRequired: 650000n,
      lateReturnCutoff: new Date("1970-01-01T22:30:00.000Z"),
      now: new Date("2026-04-20T16:45:00.000Z"),
    }));

    const updated = expectRight(result);
    expect(updated.name).toBe("Renamed Policy");
    expect(updated.baseRate).toBe(2800n);
    expect(updated.billingUnitMinutes).toBe(60);
    expect(updated.lateReturnCutoff.toISOString()).toBe("1970-01-01T22:30:00.000Z");
  });

  it("rejects update when billing unit minutes exceed the maximum", async () => {
    const policy = await fixture.factories.pricingPolicy({
      name: "Too Long Billing Policy",
      status: "INACTIVE",
    });

    const result = await runCommand(service => service.updatePolicy({
      pricingPolicyId: policy.id,
      billingUnitMinutes: 24 * 60 + 1,
    }));

    const error = expectLeftTag(result, "PricingPolicyInvalidInput") as PricingPolicyInvalidInput;
    expect(error.issues).toEqual([
      {
        path: "billingUnitMinutes",
        message: "billingUnitMinutes must be between 1 and 1440 minutes",
      },
    ]);
  });

  it("blocks updating a policy once it is referenced", async () => {
    const policy = await fixture.factories.pricingPolicy({
      name: "Used Policy",
      status: "INACTIVE",
    });
    const user = await fixture.factories.user();
    const station = await fixture.factories.station();

    await fixture.factories.reservation({
      userId: user.id,
      stationId: station.id,
      pricingPolicyId: policy.id,
    });

    const result = await runCommand(service => service.updatePolicy({
      pricingPolicyId: policy.id,
      name: "Should Not Update",
      now: new Date("2026-04-20T16:50:00.000Z"),
    }));

    const error = expectLeftTag(result, "PricingPolicyAlreadyUsed") as PricingPolicyAlreadyUsed;
    expect(error.pricingPolicyId).toBe(policy.id);
    expect(error.reservationCount).toBe(1);
    expect(error.rentalCount).toBe(0);
    expect(error.billingRecordCount).toBe(0);
  });

  it("blocks updating a policy once it is referenced by a rental", async () => {
    const policy = await fixture.factories.pricingPolicy({
      name: "Rental Used Policy",
      status: "INACTIVE",
    });
    const user = await fixture.factories.user();
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id, status: "BOOKED" });

    await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      pricingPolicyId: policy.id,
    });

    const result = await runCommand(service => service.updatePolicy({
      pricingPolicyId: policy.id,
      name: "Should Not Update Rental",
      now: new Date("2026-04-20T16:50:00.000Z"),
    }));

    const error = expectLeftTag(result, "PricingPolicyAlreadyUsed") as PricingPolicyAlreadyUsed;
    expect(error.pricingPolicyId).toBe(policy.id);
    expect(error.reservationCount).toBe(0);
    expect(error.rentalCount).toBe(1);
    expect(error.billingRecordCount).toBe(0);
  });

  it("blocks updating a policy once it is referenced by a billing record", async () => {
    const policy = await fixture.factories.pricingPolicy({
      name: "Billing Used Policy",
      status: "INACTIVE",
    });
    const user = await fixture.factories.user();
    const station = await fixture.factories.station();
    const bike = await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    const rental = await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      pricingPolicyId: null,
      status: "COMPLETED",
      endStationId: station.id,
      endTime: new Date("2026-04-21T04:00:00.000Z"),
      duration: 60,
      totalPrice: "5000",
    });

    await fixture.prisma.rentalBillingRecord.create({
      data: {
        rentalId: rental.id,
        pricingPolicyId: policy.id,
        totalDurationMinutes: 60,
        estimatedDistanceKm: null,
        baseAmount: toPrismaDecimal("7000"),
        couponRuleId: null,
        couponDiscountAmount: toPrismaDecimal("0"),
        subscriptionDiscountAmount: toPrismaDecimal("0"),
        depositForfeited: false,
        totalAmount: toPrismaDecimal("5000"),
      },
    });

    const result = await runCommand(service => service.updatePolicy({
      pricingPolicyId: policy.id,
      name: "Should Not Update Billing",
      now: new Date("2026-04-20T16:50:00.000Z"),
    }));

    const error = expectLeftTag(result, "PricingPolicyAlreadyUsed") as PricingPolicyAlreadyUsed;
    expect(error.pricingPolicyId).toBe(policy.id);
    expect(error.reservationCount).toBe(0);
    expect(error.rentalCount).toBe(0);
    expect(error.billingRecordCount).toBe(1);
  });

  it("returns mutation window closed when activating outside overnight window", async () => {
    const policy = await fixture.factories.pricingPolicy({
      name: "Blocked Activation Policy",
      status: "INACTIVE",
    });

    const result = await runCommand(service =>
      service.activatePolicy(policy.id, new Date("2026-04-20T15:00:00.000Z")));

    const error = expectLeftTag(result, "PricingPolicyMutationWindowClosed") as PricingPolicyMutationWindowClosed;
    expect(error.windowStart).toBe("23:00");
    expect(error.windowEnd).toBe("05:00");
  });

  it("returns not found when activating a nonexistent policy", async () => {
    const missingId = uuidv7();

    const result = await runCommand(service =>
      service.activatePolicy(missingId, new Date("2026-04-20T17:00:00.000Z")));

    const error = expectLeftTag(result, "PricingPolicyNotFound") as PricingPolicyNotFound;
    expect(error.pricingPolicyId).toBe(missingId);
  });

  it("activates a target policy and deactivates the previous active one", async () => {
    const nextPolicy = await fixture.factories.pricingPolicy({
      name: "Next Active Policy",
      status: "INACTIVE",
    });

    const initialActive = await fixture.prisma.pricingPolicy.findFirstOrThrow({
      where: { status: "ACTIVE" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    const result = await runCommand(service =>
      service.activatePolicy(nextPolicy.id, new Date("2026-04-20T17:00:00.000Z")));

    const activated = expectRight(result);
    expect(activated.id).toBe(nextPolicy.id);
    expect(activated.status).toBe("ACTIVE");

    const oldRow = await fixture.prisma.pricingPolicy.findUniqueOrThrow({
      where: { id: initialActive.id },
    });
    const newRow = await fixture.prisma.pricingPolicy.findUniqueOrThrow({
      where: { id: nextPolicy.id },
    });

    expect(oldRow.status).toBe("INACTIVE");
    expect(newRow.status).toBe("ACTIVE");
  });
});
