import { describe, expect, it } from "vitest";

import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { givenStationWithAvailableBike, givenUserWithWallet } from "@/test/scenarios";
import { handleEnvironmentImpactCalculateRental } from "@/worker/environment-impact-worker";

describe("environment impact worker integration", () => {
  const fixture = setupPrismaIntFixture();

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

    await handleEnvironmentImpactCalculateRental({
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

    await handleEnvironmentImpactCalculateRental(job);
    await handleEnvironmentImpactCalculateRental(job);

    const impactRows = await fixture.prisma.environmentalImpactStat.findMany({
      where: { rentalId: rental.id },
    });
    expect(impactRows).toHaveLength(1);
  });

  it("fails the job clearly when no active environment policy exists", async () => {
    const { rental } = await createCompletedRental();

    await expect(
      handleEnvironmentImpactCalculateRental({
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
