import { uuidv7 } from "uuidv7";

import { toPrismaDecimal } from "@/domain/shared/decimal";

import type { CreatedReservation, FactoryContext, ReservationOverrides } from "./types";

const defaults = {
  bikeId: null,
  reservationOption: "ONE_TIME" as const,
  fixedSlotTemplateId: null,
  subscriptionId: null,
  startTime: new Date(),
  endTime: null,
  prepaid: "0",
  status: "PENDING" as const,
};

export function createReservationFactory(ctx: FactoryContext) {
  return async (overrides: ReservationOverrides): Promise<CreatedReservation> => {
    const id = overrides.id ?? uuidv7();
    const activePricingPolicy = await ctx.prisma.pricingPolicy.findFirst({
      where: { status: "ACTIVE" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });

    if (!overrides.userId) {
      throw new Error("userId is required for createReservation");
    }
    if (!overrides.stationId) {
      throw new Error("stationId is required for createReservation");
    }

    await ctx.prisma.reservation.create({
      data: {
        id,
        userId: overrides.userId,
        bikeId: overrides.bikeId ?? defaults.bikeId,
        stationId: overrides.stationId,
        pricingPolicyId: overrides.pricingPolicyId ?? activePricingPolicy?.id ?? null,
        reservationOption: overrides.reservationOption ?? defaults.reservationOption,
        fixedSlotTemplateId: overrides.fixedSlotTemplateId ?? defaults.fixedSlotTemplateId,
        subscriptionId: overrides.subscriptionId ?? defaults.subscriptionId,
        startTime: overrides.startTime ?? defaults.startTime,
        endTime: overrides.endTime ?? defaults.endTime,
        prepaid: toPrismaDecimal(overrides.prepaid ?? defaults.prepaid),
        status: overrides.status ?? defaults.status,
        updatedAt: new Date(),
      },
    });

    return { id, userId: overrides.userId };
  };
}

export type ReservationFactory = ReturnType<typeof createReservationFactory>;
