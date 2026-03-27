import { uuidv7 } from "uuidv7";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeReservationRepository } from "../reservation.repository";

type ReservationRepoClient = PrismaClient | PrismaTypes.TransactionClient;

export function setupReservationRepositoryIntTestKit() {
  const fixture = setupPrismaIntFixture();

  async function createStation(args: {
    name: string;
    latitude?: number;
    longitude?: number;
  }) {
    return fixture.factories.station({
      name: args.name,
      latitude: args.latitude ?? 10.0,
      longitude: args.longitude ?? 20.0,
    });
  }

  async function createUser() {
    const user = await fixture.factories.user({ fullname: "Test User" });
    return { id: user.id };
  }

  async function createBike(args: {
    stationId: string;
    status?:
      | "AVAILABLE"
      | "BOOKED"
      | "BROKEN"
      | "RESERVED"
      | "MAINTAINED"
      | "UNAVAILABLE";
  }) {
    const bike = await fixture.factories.bike({
      stationId: args.stationId,
      status: args.status ?? "AVAILABLE",
    });

    return { id: bike.id };
  }

  async function createFixedSlotTemplate(args: {
    userId: string;
    stationId: string;
    slotStart: Date;
  }) {
    return fixture.prisma.fixedSlotTemplate.create({
      data: {
        id: uuidv7(),
        userId: args.userId,
        stationId: args.stationId,
        slotStart: args.slotStart,
        status: "ACTIVE",
        updatedAt: new Date(),
      },
      select: { id: true },
    });
  }

  return {
    fixture,
    makeRepo: (client: ReservationRepoClient = fixture.prisma) =>
      makeReservationRepository(client),
    createStation,
    createUser,
    createBike,
    createFixedSlotTemplate,
  };
}
