import { Layer } from "effect";
import { beforeAll, describe, expect, it } from "vitest";

import type { RentalRepository } from "@/domain/rentals";

import { BikeRepository, makeBikeRepository } from "@/domain/bikes";
import {
  confirmRentalReturnByOperator,
  createReturnSlot,
  makeReturnConfirmationRepository,
  makeReturnSlotRepository,
  ReturnConfirmationRepository,
  ReturnSlotRepository,
} from "@/domain/rentals";
import {
  makeReservationRunners,
  makeReservationTestLayer,
} from "@/domain/reservations/services/test/reservation-test-kit";
import { Prisma } from "@/infrastructure/prisma";
import { expectRight } from "@/test/effect/assertions";
import { runEffectEitherWithLayer } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { givenStationWithAvailableBike, givenUserWithWallet } from "@/test/scenarios";

describe("rental pricing lifecycle integration", () => {
  const fixture = setupPrismaIntFixture();
  let reservationLayer: ReturnType<typeof makeReservationTestLayer>;
  let rentalFlowLayer: Layer.Layer<
    | Prisma
    | BikeRepository
    | RentalRepository
    | ReturnSlotRepository
    | ReturnConfirmationRepository
  >;
  let runReserve: ReturnType<typeof makeReservationRunners>["reserve"];
  let runConfirm: ReturnType<typeof makeReservationRunners>["confirm"];

  beforeAll(() => {
    reservationLayer = makeReservationTestLayer(fixture.prisma);
    rentalFlowLayer = Layer.mergeAll(
      reservationLayer,
      Layer.succeed(Prisma, Prisma.make({ client: fixture.prisma })),
      Layer.succeed(BikeRepository, BikeRepository.make(makeBikeRepository(fixture.prisma))),
      Layer.succeed(
        ReturnSlotRepository,
        ReturnSlotRepository.make(makeReturnSlotRepository(fixture.prisma)),
      ),
      Layer.succeed(
        ReturnConfirmationRepository,
        ReturnConfirmationRepository.make(makeReturnConfirmationRepository(fixture.prisma)),
      ),
    );

    const runners = makeReservationRunners(reservationLayer);
    runReserve = runners.reserve;
    runConfirm = runners.confirm;
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

    expectRight(await runEffectEitherWithLayer(
      createReturnSlot({
        rentalId: rental!.id,
        userId: user.id,
        stationId: station.id,
        now: confirmNow,
      }),
      rentalFlowLayer,
    ));

    const returnConfirmedAt = new Date("2026-03-22T09:45:00.000Z");
    const completedRental = expectRight(await runEffectEitherWithLayer(
      confirmRentalReturnByOperator({
        rentalId: rental!.id,
        stationId: station.id,
        confirmedByUserId: operator.id,
        confirmationMethod: "MANUAL",
        confirmedAt: returnConfirmedAt,
      }),
      rentalFlowLayer,
    ));

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
});
