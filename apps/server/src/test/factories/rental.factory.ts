import { uuidv7 } from "uuidv7";

import type { CreatedRental, FactoryContext, RentalOverrides } from "./types";

const defaults = {
  bikeId: null,
  endStationId: null,
  startTime: new Date(),
  endTime: null,
  duration: null,
  totalPrice: null,
  subscriptionId: null,
  status: "RENTED" as const,
};

export function createRentalFactory(ctx: FactoryContext) {
  return async (overrides: RentalOverrides): Promise<CreatedRental> => {
    const id = overrides.id ?? uuidv7();

    if (!overrides.userId) {
      throw new Error("userId is required for createRental");
    }
    if (!overrides.startStationId) {
      throw new Error("startStationId is required for createRental");
    }

    await ctx.prisma.rental.create({
      data: {
        id,
        userId: overrides.userId,
        reservationId: overrides.reservationId ?? null,
        bikeId: overrides.bikeId ?? defaults.bikeId,
        startStationId: overrides.startStationId,
        endStationId: overrides.endStationId ?? defaults.endStationId,
        startTime: overrides.startTime ?? defaults.startTime,
        endTime: overrides.endTime ?? defaults.endTime,
        duration: overrides.duration ?? defaults.duration,
        totalPrice: overrides.totalPrice ?? defaults.totalPrice,
        subscriptionId: overrides.subscriptionId ?? defaults.subscriptionId,
        status: overrides.status ?? defaults.status,
        updatedAt: new Date(),
      },
    });

    return { id, userId: overrides.userId };
  };
}

export type RentalFactory = ReturnType<typeof createRentalFactory>;
