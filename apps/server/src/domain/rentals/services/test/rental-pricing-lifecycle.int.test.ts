import { beforeAll, describe, expect, it } from "vitest";

import { expectRight } from "@/test/effect/assertions";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { givenStationWithAvailableBike, givenUserWithWallet } from "@/test/scenarios";

import { makeReservationRentalFlowTestKit } from "./reservation-rental-flow-test-kit";

describe("rental pricing lifecycle integration", () => {
  const fixture = setupPrismaIntFixture();
  let runReserve: ReturnType<typeof makeReservationRentalFlowTestKit>["reserve"];
  let runConfirm: ReturnType<typeof makeReservationRentalFlowTestKit>["confirm"];
  let runCreateReturnSlot: ReturnType<typeof makeReservationRentalFlowTestKit>["createReturnSlot"];
  let runConfirmReturn: ReturnType<typeof makeReservationRentalFlowTestKit>["confirmReturn"];

  beforeAll(() => {
    const flow = makeReservationRentalFlowTestKit(fixture.prisma);
    runReserve = flow.reserve;
    runConfirm = flow.confirm;
    runCreateReturnSlot = flow.createReturnSlot;
    runConfirmReturn = flow.confirmReturn;
  });

  it("keeps reservation pricing policy snapshot even after the active policy changes", async () => {
    await fixture.prisma.pricingPolicy.updateMany({
      data: { status: "INACTIVE" },
    });

    const policyA = await fixture.factories.pricingPolicy({
      name: "Policy A",
      baseRate: "4000",
      reservationFee: "3000",
      depositRequired: "2000",
      status: "ACTIVE",
    });
    const policyB = await fixture.factories.pricingPolicy({
      name: "Policy B",
      baseRate: "9000",
      reservationFee: "5000",
      depositRequired: "2000",
      status: "INACTIVE",
    });

    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 50_000n },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture, {
      station: { capacity: 3 },
    });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    const operator = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: station.id });

    const reserveNow = new Date("2026-03-22T09:00:00.000Z");
    const reservation = expectRight(await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: reserveNow,
      now: reserveNow,
    }));

    expect(reservation.pricingPolicyId).toBe(policyA.id);
    expect(reservation.prepaid.toString()).toBe("3000");

    await fixture.prisma.pricingPolicy.update({
      where: { id: policyA.id },
      data: { status: "INACTIVE" },
    });
    await fixture.prisma.pricingPolicy.update({
      where: { id: policyB.id },
      data: { status: "ACTIVE" },
    });

    const confirmNow = new Date("2026-03-22T09:05:00.000Z");
    expectRight(await runConfirm({
      reservationId: reservation.id,
      userId: user.id,
      now: confirmNow,
    }));

    const rental = await fixture.prisma.rental.findFirst({
      where: { reservationId: reservation.id },
    });
    expect(rental?.pricingPolicyId).toBe(policyA.id);
    expect(rental?.depositHoldId).not.toBeNull();

    const activeHold = await fixture.prisma.walletHold.findUnique({
      where: { id: rental!.depositHoldId! },
    });
    expect(activeHold?.reason).toBe("RENTAL_DEPOSIT");
    expect(activeHold?.status).toBe("ACTIVE");

    const walletBeforeReturn = await fixture.prisma.wallet.findUnique({
      where: { userId: user.id },
    });
    expect(walletBeforeReturn?.reservedBalance.toString()).toBe("2000");

    expectRight(await runCreateReturnSlot({
      rentalId: rental!.id,
      userId: user.id,
      stationId: station.id,
      now: confirmNow,
    }));

    const returnConfirmedAt = new Date("2026-03-22T09:45:00.000Z");
    const completedRental = expectRight(await runConfirmReturn({
      rentalId: rental!.id,
      stationId: station.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: returnConfirmedAt,
    }));

    expect(completedRental.pricingPolicyId).toBe(policyA.id);
    expect(completedRental.totalPrice).toBe(5000);

    const billingRecord = await fixture.prisma.rentalBillingRecord.findUnique({
      where: { rentalId: rental!.id },
    });
    expect(billingRecord?.pricingPolicyId).toBe(policyA.id);
    expect(billingRecord?.baseAmount.toString()).toBe("8000");
    expect(billingRecord?.couponRuleId).toBeNull();
    expect(billingRecord?.couponRuleSnapshot).toBeNull();
    expect(billingRecord?.totalAmount.toString()).toBe("5000");

    const releasedHold = await fixture.prisma.walletHold.findUnique({
      where: { id: rental!.depositHoldId! },
    });
    expect(releasedHold?.status).toBe("RELEASED");
    expect(releasedHold?.releasedAt?.toISOString()).toBe(returnConfirmedAt.toISOString());

    const walletAfterReturn = await fixture.prisma.wallet.findUnique({
      where: { userId: user.id },
    });
    expect(walletAfterReturn?.reservedBalance.toString()).toBe("0");
  });

  it("applies the best global coupon rule when finalizing a wallet rental without subscription", async () => {
    await fixture.prisma.pricingPolicy.updateMany({
      data: { status: "INACTIVE" },
    });

    await fixture.factories.pricingPolicy({
      name: "Global Coupon Finalize Policy",
      baseRate: "4000",
      reservationFee: "3000",
      depositRequired: "2000",
      status: "ACTIVE",
    });

    await fixture.prisma.couponRule.createMany({
      data: [
        {
          name: "Finalize 1h Discount",
          triggerType: "RIDING_DURATION",
          minRidingMinutes: 60,
          discountType: "FIXED_AMOUNT",
          discountValue: "1000",
          status: "ACTIVE",
          priority: 100,
        },
        {
          name: "Finalize Best Discount",
          triggerType: "RIDING_DURATION",
          minRidingMinutes: 120,
          discountType: "FIXED_AMOUNT",
          discountValue: "2000",
          status: "ACTIVE",
          priority: 90,
        },
      ],
    });

    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 50_000n },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture, {
      station: { capacity: 3 },
    });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    const operator = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: station.id });

    const reserveNow = new Date("2026-03-22T09:00:00.000Z");
    const reservation = expectRight(await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: reserveNow,
      now: reserveNow,
    }));

    const confirmNow = new Date("2026-03-22T09:05:00.000Z");
    expectRight(await runConfirm({
      reservationId: reservation.id,
      userId: user.id,
      now: confirmNow,
    }));

    const rental = await fixture.prisma.rental.findFirst({
      where: { reservationId: reservation.id },
    });

    expectRight(await runCreateReturnSlot({
      rentalId: rental!.id,
      userId: user.id,
      stationId: station.id,
      now: confirmNow,
    }));

    const returnConfirmedAt = new Date("2026-03-22T11:05:00.000Z");
    const completedRental = expectRight(await runConfirmReturn({
      rentalId: rental!.id,
      stationId: station.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: returnConfirmedAt,
    }));

    expect(completedRental.totalPrice).toBe(11000);

    const billingRecord = await fixture.prisma.rentalBillingRecord.findUnique({
      where: { rentalId: rental!.id },
    });
    expect(billingRecord?.baseAmount.toString()).toBe("16000");
    expect(billingRecord?.couponRuleId).not.toBeNull();
    expect(billingRecord?.couponRuleSnapshot).toMatchObject({
      name: "Finalize Best Discount",
      triggerType: "RIDING_DURATION",
      minRidingMinutes: 120,
      discountType: "FIXED_AMOUNT",
      discountValue: 2000,
      priority: 90,
      billableMinutes: 120,
      billableHours: 2,
      appliedAt: returnConfirmedAt.toISOString(),
    });
    expect(billingRecord?.couponDiscountAmount.toString()).toBe("2000");
    expect(billingRecord?.subscriptionDiscountAmount.toString()).toBe("0");
    expect(billingRecord?.totalAmount.toString()).toBe("11000");
  });

  it("selects a global coupon rule by billable minutes when finalizing a wallet rental", async () => {
    await fixture.prisma.pricingPolicy.updateMany({
      data: { status: "INACTIVE" },
    });

    await fixture.factories.pricingPolicy({
      name: "Global Coupon Billable Minutes Policy",
      baseRate: "4000",
      reservationFee: "3000",
      depositRequired: "2000",
      status: "ACTIVE",
    });

    await fixture.prisma.couponRule.createMany({
      data: [
        {
          name: "Finalize Billable 1h Discount",
          triggerType: "RIDING_DURATION",
          minRidingMinutes: 60,
          discountType: "FIXED_AMOUNT",
          discountValue: "1000",
          status: "ACTIVE",
          priority: 100,
        },
        {
          name: "Finalize Billable 2h Discount",
          triggerType: "RIDING_DURATION",
          minRidingMinutes: 120,
          discountType: "FIXED_AMOUNT",
          discountValue: "2000",
          status: "ACTIVE",
          priority: 100,
        },
      ],
    });

    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 50_000n },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture, {
      station: { capacity: 3 },
    });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    const operator = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: station.id });

    const reserveNow = new Date("2026-03-22T09:00:00.000Z");
    const reservation = expectRight(await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: reserveNow,
      now: reserveNow,
    }));

    const confirmNow = new Date("2026-03-22T09:05:00.000Z");
    expectRight(await runConfirm({
      reservationId: reservation.id,
      userId: user.id,
      now: confirmNow,
    }));

    const rental = await fixture.prisma.rental.findFirst({
      where: { reservationId: reservation.id },
    });

    expectRight(await runCreateReturnSlot({
      rentalId: rental!.id,
      userId: user.id,
      stationId: station.id,
      now: confirmNow,
    }));

    const returnConfirmedAt = new Date("2026-03-22T10:35:01.000Z");
    const completedRental = expectRight(await runConfirmReturn({
      rentalId: rental!.id,
      stationId: station.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: returnConfirmedAt,
    }));

    expect(completedRental.totalPrice).toBe(11000);

    const billingRecord = await fixture.prisma.rentalBillingRecord.findUnique({
      where: { rentalId: rental!.id },
    });
    expect(billingRecord?.totalDurationMinutes).toBe(91);
    expect(billingRecord?.baseAmount.toString()).toBe("16000");
    expect(billingRecord?.couponRuleSnapshot).toMatchObject({
      name: "Finalize Billable 2h Discount",
      triggerType: "RIDING_DURATION",
      minRidingMinutes: 120,
      discountType: "FIXED_AMOUNT",
      discountValue: 2000,
      priority: 100,
      billableMinutes: 120,
      billableHours: 2,
      appliedAt: returnConfirmedAt.toISOString(),
    });
    expect(billingRecord?.couponDiscountAmount.toString()).toBe("2000");
    expect(billingRecord?.totalAmount.toString()).toBe("11000");
  });

  it("ignores inactive coupon rules when finalizing a wallet rental", async () => {
    await fixture.prisma.pricingPolicy.updateMany({
      data: { status: "INACTIVE" },
    });

    await fixture.factories.pricingPolicy({
      name: "Global Coupon Inactive Finalize Policy",
      baseRate: "4000",
      reservationFee: "3000",
      depositRequired: "2000",
      status: "ACTIVE",
    });

    await fixture.prisma.couponRule.createMany({
      data: [
        {
          name: "Finalize Active Discount",
          triggerType: "RIDING_DURATION",
          minRidingMinutes: 60,
          discountType: "FIXED_AMOUNT",
          discountValue: "1000",
          status: "ACTIVE",
          priority: 100,
        },
        {
          name: "Finalize Inactive Better Discount",
          triggerType: "RIDING_DURATION",
          minRidingMinutes: 120,
          discountType: "FIXED_AMOUNT",
          discountValue: "2000",
          status: "INACTIVE",
          priority: 10,
        },
      ],
    });

    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 50_000n },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture, {
      station: { capacity: 3 },
    });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    const operator = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: station.id });

    const reserveNow = new Date("2026-03-22T09:00:00.000Z");
    const reservation = expectRight(await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: reserveNow,
      now: reserveNow,
    }));

    const confirmNow = new Date("2026-03-22T09:05:00.000Z");
    expectRight(await runConfirm({
      reservationId: reservation.id,
      userId: user.id,
      now: confirmNow,
    }));

    const rental = await fixture.prisma.rental.findFirst({
      where: { reservationId: reservation.id },
    });

    expectRight(await runCreateReturnSlot({
      rentalId: rental!.id,
      userId: user.id,
      stationId: station.id,
      now: confirmNow,
    }));

    const returnConfirmedAt = new Date("2026-03-22T11:05:00.000Z");
    const completedRental = expectRight(await runConfirmReturn({
      rentalId: rental!.id,
      stationId: station.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: returnConfirmedAt,
    }));

    expect(completedRental.totalPrice).toBe(12000);

    const billingRecord = await fixture.prisma.rentalBillingRecord.findUnique({
      where: { rentalId: rental!.id },
    });
    expect(billingRecord?.baseAmount.toString()).toBe("16000");
    expect(billingRecord?.couponRuleId).not.toBeNull();
    expect(billingRecord?.couponRuleSnapshot).toMatchObject({
      name: "Finalize Active Discount",
      triggerType: "RIDING_DURATION",
      minRidingMinutes: 60,
      discountType: "FIXED_AMOUNT",
      discountValue: 1000,
      priority: 100,
      billableMinutes: 120,
      billableHours: 2,
      appliedAt: returnConfirmedAt.toISOString(),
    });
    expect(billingRecord?.couponDiscountAmount.toString()).toBe("1000");
    expect(billingRecord?.subscriptionDiscountAmount.toString()).toBe("0");
    expect(billingRecord?.totalAmount.toString()).toBe("12000");
  });

  it("forfeits the deposit when return confirmation happens after the late cutoff", async () => {
    await fixture.prisma.pricingPolicy.updateMany({
      data: { status: "INACTIVE" },
    });

    const policy = await fixture.factories.pricingPolicy({
      name: "Late Cutoff Policy",
      baseRate: "4000",
      reservationFee: "3000",
      depositRequired: "2000",
      status: "ACTIVE",
      lateReturnCutoff: new Date("1970-01-01T23:00:00.000Z"),
    });

    const { user } = await givenUserWithWallet(fixture, {
      wallet: { balance: 50_000n },
    });
    const { station, bike } = await givenStationWithAvailableBike(fixture, {
      station: { capacity: 3 },
    });
    await fixture.factories.bike({ stationId: station.id, status: "AVAILABLE" });
    const operator = await fixture.factories.user({ role: "STAFF" });
    await fixture.factories.userOrgAssignment({ userId: operator.id, stationId: station.id });

    const reserveNow = new Date("2026-03-22T15:00:00.000Z");
    const reservation = expectRight(await runReserve({
      userId: user.id,
      bikeId: bike.id,
      stationId: station.id,
      startTime: reserveNow,
      now: reserveNow,
    }));

    const confirmNow = new Date("2026-03-22T15:05:00.000Z");
    expectRight(await runConfirm({
      reservationId: reservation.id,
      userId: user.id,
      now: confirmNow,
    }));

    const rental = await fixture.prisma.rental.findFirst({
      where: { reservationId: reservation.id },
    });
    expect(rental?.pricingPolicyId).toBe(policy.id);
    expect(rental?.depositHoldId).not.toBeNull();

    expectRight(await runCreateReturnSlot({
      rentalId: rental!.id,
      userId: user.id,
      stationId: station.id,
      now: confirmNow,
    }));

    const lateConfirmedAt = new Date("2026-03-22T16:30:01.000Z");
    const completedRental = expectRight(await runConfirmReturn({
      rentalId: rental!.id,
      stationId: station.id,
      confirmedByUserId: operator.id,
      confirmationMethod: "MANUAL",
      confirmedAt: lateConfirmedAt,
    }));

    expect(completedRental.status).toBe("COMPLETED");

    const billingRecord = await fixture.prisma.rentalBillingRecord.findUnique({
      where: { rentalId: rental!.id },
    });
    expect(billingRecord?.depositForfeited).toBe(true);

    const forfeitedHold = await fixture.prisma.walletHold.findUnique({
      where: { id: rental!.depositHoldId! },
    });
    expect(forfeitedHold?.status).toBe("SETTLED");
    expect(forfeitedHold?.forfeitedAt?.toISOString()).toBe(lateConfirmedAt.toISOString());

    const walletAfterReturn = await fixture.prisma.wallet.findUnique({
      where: { userId: user.id },
    });
    expect(walletAfterReturn?.reservedBalance.toString()).toBe("0");
    expect(walletAfterReturn?.balance.toString()).toBe("36000");
  });
});
