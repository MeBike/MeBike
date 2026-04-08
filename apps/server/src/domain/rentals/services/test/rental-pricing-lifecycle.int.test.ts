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
    const { station, bike } = await givenStationWithAvailableBike(fixture);
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
    const { station, bike } = await givenStationWithAvailableBike(fixture);
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
