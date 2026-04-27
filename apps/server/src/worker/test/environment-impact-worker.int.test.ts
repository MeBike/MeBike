import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import type {
  EnvironmentImpactServiceTag,
} from "@/domain/environment";
import type { EffectRunner } from "@/worker/worker-runtime";

import {
  EnvironmentImpactRepositoryLive,
  EnvironmentImpactServiceLive,
  EnvironmentPolicyRepositoryLive,
  EnvironmentPolicyServiceLive,
} from "@/domain/environment";
import { Prisma } from "@/infrastructure/prisma";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { givenStationWithAvailableBike, givenUserWithWallet } from "@/test/scenarios";
import { makeEnvironmentImpactCalculateRentalHandler } from "@/worker/environment-impact-worker";

describe("environment impact worker integration", () => {
  const fixture = setupPrismaIntFixture();

  function makeHandler() {
    const PrismaTestLive = Layer.succeed(Prisma, Prisma.make({ client: fixture.prisma }));
    const EnvironmentPolicyReposTestLive = EnvironmentPolicyRepositoryLive.pipe(
      Layer.provide(PrismaTestLive),
    );
    const EnvironmentImpactReposTestLive = EnvironmentImpactRepositoryLive.pipe(
      Layer.provide(PrismaTestLive),
    );
    const EnvironmentPolicyServiceTestLayer = EnvironmentPolicyServiceLive.pipe(
      Layer.provide(EnvironmentPolicyReposTestLive),
    );
    const EnvironmentImpactServiceTestLayer = EnvironmentImpactServiceLive.pipe(
      Layer.provide(EnvironmentImpactReposTestLive),
      Layer.provide(EnvironmentPolicyServiceTestLayer),
    );
    const TestLive = Layer.mergeAll(
      PrismaTestLive,
      EnvironmentPolicyReposTestLive,
      EnvironmentImpactReposTestLive,
      EnvironmentPolicyServiceTestLayer,
      EnvironmentImpactServiceTestLayer,
    );
    const runEffect: EffectRunner<EnvironmentImpactServiceTag> = effect => Effect.runPromise(
      effect.pipe(Effect.provide(TestLive)),
    );

    return makeEnvironmentImpactCalculateRentalHandler(runEffect);
  }

  async function createActiveEnvironmentPolicy() {
    return fixture.prisma.environmentalImpactPolicy.create({
      data: {
        name: "Phase 1 test policy",
        averageSpeedKmh: "12.00",
        co2SavedPerKm: "100.0000",
        status: "ACTIVE",
        activeFrom: new Date("2026-01-01T00:00:00.000Z"),
        formulaConfig: {
          return_scan_buffer_minutes: 0,
          confidence_factor: 1,
        },
      },
    });
  }

  async function createCompletedRental() {
    const { user } = await givenUserWithWallet(fixture);
    const { station, bike } = await givenStationWithAvailableBike(fixture);
    const startTime = new Date("2026-03-21T10:00:00.000Z");
    const endTime = new Date("2026-03-21T11:00:00.000Z");
    const rental = await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      endStationId: station.id,
      startTime,
      endTime,
      duration: 60,
      status: "COMPLETED",
    });

    return { user, rental };
  }

  it("calculates impact for a completed rental job", async () => {
    const policy = await createActiveEnvironmentPolicy();
    const { rental } = await createCompletedRental();

    await makeHandler()({
      id: "environment-impact-test-1",
      data: {
        version: 1,
        rentalId: rental.id,
      },
    });

    const impact = await fixture.prisma.environmentalImpactStat.findUnique({
      where: { rentalId: rental.id },
    });
    expect(impact).not.toBeNull();
    expect(impact?.policyId).toBe(policy.id);
    expect(impact?.estimatedDistanceKm?.toNumber()).toBe(12);
    expect(impact?.co2Saved.toNumber()).toBe(1200);
  });

  it("is idempotent when the same rental job is processed more than once", async () => {
    await createActiveEnvironmentPolicy();
    const { rental } = await createCompletedRental();
    const job = {
      id: "environment-impact-test-2",
      data: {
        version: 1 as const,
        rentalId: rental.id,
      },
    };

    const handler = makeHandler();
    await handler(job);
    await handler(job);

    const impactRows = await fixture.prisma.environmentalImpactStat.findMany({
      where: { rentalId: rental.id },
    });
    expect(impactRows).toHaveLength(1);
  });

  it("fails the job clearly when no active environment policy exists", async () => {
    const { rental } = await createCompletedRental();

    await expect(
      makeHandler()({
        id: "environment-impact-test-3",
        data: {
          version: 1,
          rentalId: rental.id,
        },
      }),
    ).rejects.toMatchObject({
      _tag: "ActiveEnvironmentPolicyNotFound",
    });

    const impactCount = await fixture.prisma.environmentalImpactStat.count({
      where: { rentalId: rental.id },
    });
    expect(impactCount).toBe(0);
  });
});
