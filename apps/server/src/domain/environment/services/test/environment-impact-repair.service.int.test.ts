import { JobTypes } from "@mebike/shared/contracts/server/jobs";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import {
  makeEnvironmentImpactRepairRepository,
  repairMissingEnvironmentImpactJobs,
} from "@/domain/environment";
import {
  environmentImpactRentalDedupeKey,
} from "@/domain/rentals/services/workers/environment-impact-job.service";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import {
  givenStationWithAvailableBike,
  givenUserWithWallet,
} from "@/test/scenarios";

describe("environment impact repair jobs integration", () => {
  const fixture = setupPrismaIntFixture();

  async function createEnvironmentPolicy() {
    return fixture.prisma.environmentalImpactPolicy.create({
      data: {
        name: "Repair test policy",
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

  async function createRental(input: {
    status: "RENTED" | "COMPLETED";
    startTime?: Date;
    endTime?: Date | null;
  }) {
    const { user } = await givenUserWithWallet(fixture);
    const { station, bike } = await givenStationWithAvailableBike(fixture);
    const startTime = input.startTime ?? new Date("2026-04-01T10:00:00.000Z");
    const endTime = input.endTime === undefined
      ? new Date("2026-04-01T11:00:00.000Z")
      : input.endTime;

    const rental = await fixture.factories.rental({
      userId: user.id,
      bikeId: bike.id,
      startStationId: station.id,
      endStationId: endTime ? station.id : null,
      startTime,
      endTime,
      duration: endTime ? 60 : null,
      status: input.status,
    });

    return { user, rental };
  }

  async function createExistingImpact(input: {
    userId: string;
    rentalId: string;
  }) {
    const policy = await createEnvironmentPolicy();

    return fixture.prisma.environmentalImpactStat.create({
      data: {
        userId: input.userId,
        rentalId: input.rentalId,
        policyId: policy.id,
        estimatedDistanceKm: "12.00",
        co2Saved: "1200.0000",
        policySnapshot: {
          policy_id: policy.id,
          policy_name: policy.name,
          average_speed_kmh: 12,
          co2_saved_per_km: 100,
          co2_saved_per_km_unit: "gCO2e/km",
          return_scan_buffer_minutes: 0,
          confidence_factor: 1,
          raw_rental_minutes: 60,
          effective_ride_minutes: 60,
          estimated_distance_km: 12,
          co2_saved: 1200,
          co2_saved_unit: "gCO2e",
          distance_source: "TIME_SPEED",
          formula_version: "PHASE_1_TIME_SPEED",
          formula:
            "co2_saved = round(estimated_distance_km * co2_saved_per_km * confidence_factor)",
        },
      },
    });
  }

  async function runRepair(input: {
    limit: number;
    completedFrom?: Date;
    completedTo?: Date;
  }) {
    const repo = makeEnvironmentImpactRepairRepository(fixture.prisma);
    return Effect.runPromise(
      repairMissingEnvironmentImpactJobs(fixture.prisma, repo, input),
    );
  }

  it("enqueues a calculation job for a completed rental without impact", async () => {
    const { rental } = await createRental({ status: "COMPLETED" });

    const summary = await runRepair({ limit: 100 });

    expect(summary).toMatchObject({
      scanned: 1,
      found: 1,
      attempted: 1,
      enqueued: 1,
      alreadyQueued: 0,
      failed: 0,
    });

    const outboxRows = await fixture.prisma.jobOutbox.findMany({
      where: {
        type: JobTypes.EnvironmentImpactCalculateRental,
        dedupeKey: environmentImpactRentalDedupeKey(rental.id),
      },
    });

    expect(outboxRows).toHaveLength(1);
    expect(outboxRows[0]?.payload).toEqual({
      version: 1,
      rentalId: rental.id,
    });
  });

  it("does not enqueue when the completed rental already has impact", async () => {
    const { user, rental } = await createRental({ status: "COMPLETED" });
    await createExistingImpact({ userId: user.id, rentalId: rental.id });

    const summary = await runRepair({ limit: 100 });

    expect(summary).toMatchObject({
      scanned: 0,
      found: 0,
      attempted: 0,
      enqueued: 0,
      alreadyQueued: 0,
      failed: 0,
    });

    const outboxCount = await fixture.prisma.jobOutbox.count({
      where: { type: JobTypes.EnvironmentImpactCalculateRental },
    });
    expect(outboxCount).toBe(0);
  });

  it("does not enqueue jobs for rented rentals", async () => {
    await createRental({ status: "RENTED", endTime: null });

    const summary = await runRepair({ limit: 100 });

    expect(summary.found).toBe(0);
    expect(summary.enqueued).toBe(0);

    const outboxCount = await fixture.prisma.jobOutbox.count({
      where: { type: JobTypes.EnvironmentImpactCalculateRental },
    });
    expect(outboxCount).toBe(0);
  });

  it("does not duplicate existing pending or sent jobs with the same dedupe key", async () => {
    const pending = await createRental({
      status: "COMPLETED",
      endTime: new Date("2026-04-01T10:00:00.000Z"),
    });
    const sent = await createRental({
      status: "COMPLETED",
      endTime: new Date("2026-04-02T10:00:00.000Z"),
    });

    await fixture.prisma.jobOutbox.create({
      data: {
        type: JobTypes.EnvironmentImpactCalculateRental,
        dedupeKey: environmentImpactRentalDedupeKey(pending.rental.id),
        payload: {
          version: 1,
          rentalId: pending.rental.id,
        },
        runAt: new Date(),
        status: "PENDING",
      },
    });
    await fixture.prisma.jobOutbox.create({
      data: {
        type: JobTypes.EnvironmentImpactCalculateRental,
        dedupeKey: environmentImpactRentalDedupeKey(sent.rental.id),
        payload: {
          version: 1,
          rentalId: sent.rental.id,
        },
        runAt: new Date(),
        status: "SENT",
      },
    });

    const summary = await runRepair({ limit: 100 });

    expect(summary).toMatchObject({
      scanned: 2,
      found: 2,
      attempted: 2,
      enqueued: 0,
      alreadyQueued: 2,
      failed: 0,
    });

    const outboxCount = await fixture.prisma.jobOutbox.count({
      where: {
        type: JobTypes.EnvironmentImpactCalculateRental,
        dedupeKey: {
          in: [
            environmentImpactRentalDedupeKey(pending.rental.id),
            environmentImpactRentalDedupeKey(sent.rental.id),
          ],
        },
      },
    });
    expect(outboxCount).toBe(2);
  });

  it("respects the repair limit", async () => {
    await createRental({
      status: "COMPLETED",
      endTime: new Date("2026-04-01T10:00:00.000Z"),
    });
    await createRental({
      status: "COMPLETED",
      endTime: new Date("2026-04-02T10:00:00.000Z"),
    });

    const summary = await runRepair({ limit: 1 });

    expect(summary.found).toBe(1);
    expect(summary.enqueued).toBe(1);

    const outboxCount = await fixture.prisma.jobOutbox.count({
      where: { type: JobTypes.EnvironmentImpactCalculateRental },
    });
    expect(outboxCount).toBe(1);
  });

  it("filters completed rentals by end time range", async () => {
    const before = await createRental({
      status: "COMPLETED",
      endTime: new Date("2026-03-31T23:59:59.999Z"),
    });
    const inside = await createRental({
      status: "COMPLETED",
      endTime: new Date("2026-04-15T12:00:00.000Z"),
    });
    const after = await createRental({
      status: "COMPLETED",
      endTime: new Date("2026-05-01T00:00:00.000Z"),
    });

    const summary = await runRepair({
      limit: 100,
      completedFrom: new Date("2026-04-01T00:00:00.000Z"),
      completedTo: new Date("2026-04-30T23:59:59.999Z"),
    });

    expect(summary.found).toBe(1);
    expect(summary.enqueued).toBe(1);

    const jobs = await fixture.prisma.jobOutbox.findMany({
      where: { type: JobTypes.EnvironmentImpactCalculateRental },
      orderBy: { createdAt: "asc" },
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.dedupeKey).toBe(
      environmentImpactRentalDedupeKey(inside.rental.id),
    );
    expect(jobs[0]?.dedupeKey).not.toBe(
      environmentImpactRentalDedupeKey(before.rental.id),
    );
    expect(jobs[0]?.dedupeKey).not.toBe(
      environmentImpactRentalDedupeKey(after.rental.id),
    );
  });
});
