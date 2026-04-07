import { uuidv7 } from "uuidv7";

import type { PrismaClient } from "../../generated/prisma/client";

import {
  BikeStatus,
  RentalStatus,
  SupplierStatus,
  UserVerifyStatus,
} from "../../generated/prisma/client";
import { formatBikeNumber } from "../../src/domain/bikes/bike-number";
import { DEFAULT_PRICING_POLICY_ID } from "../seed-pricing-policy";

export type SeedUserInput = {
  readonly email: string;
  readonly fullName: string;
  readonly phoneNumber: string;
  readonly passwordHash?: string;
  readonly verifyStatus?: UserVerifyStatus;
};

export type SeedSupplierInput = {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly phoneNumber: string;
  readonly contractFee: number;
  readonly status?: SupplierStatus;
};

export type SeedBikeInput = {
  readonly chipId: string;
  readonly stationId: string;
  readonly supplierId?: string | null;
  readonly status?: BikeStatus;
};

export type SeedRentalInput = {
  readonly id: string;
  readonly userId: string;
  readonly bikeId: string;
  readonly startStationId: string;
  readonly endStationId: string | null;
  readonly startTime: Date;
  readonly endTime: Date | null;
  readonly duration: number | null;
  readonly totalPrice: number | null;
  readonly pricingPolicyId?: string | null;
  readonly status?: RentalStatus;
};

export type SeedRatingInput = {
  readonly rentalId: string;
  readonly userId: string;
  readonly bikeId: string | null;
  readonly stationId: string | null;
  readonly bikeScore: number;
  readonly stationScore: number;
  readonly comment: string | null;
};

export type SeedRatingReasonLinkInput = {
  readonly ratingId: string;
  readonly reasonId: string;
  readonly target: "bike" | "station";
};

export async function upsertSeedUser(prisma: PrismaClient, input: SeedUserInput) {
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      fullName: input.fullName,
      passwordHash: input.passwordHash ?? "seeded-hash",
      phoneNumber: input.phoneNumber,
      verifyStatus: input.verifyStatus ?? UserVerifyStatus.VERIFIED,
    },
    create: {
      id: uuidv7(),
      email: input.email,
      fullName: input.fullName,
      passwordHash: input.passwordHash ?? "seeded-hash",
      phoneNumber: input.phoneNumber,
      verifyStatus: input.verifyStatus ?? UserVerifyStatus.VERIFIED,
    },
    select: { id: true },
  });
}

export async function upsertSeedSupplier(prisma: PrismaClient, input: SeedSupplierInput) {
  return prisma.supplier.upsert({
    where: { id: input.id },
    update: {
      address: input.address,
      contractFee: input.contractFee,
      name: input.name,
      phoneNumber: input.phoneNumber,
      status: input.status ?? SupplierStatus.ACTIVE,
      updatedAt: new Date(),
    },
    create: {
      id: input.id,
      address: input.address,
      contractFee: input.contractFee,
      name: input.name,
      phoneNumber: input.phoneNumber,
      status: input.status ?? SupplierStatus.ACTIVE,
      updatedAt: new Date(),
    },
    select: { id: true },
  });
}

export async function upsertSeedBike(prisma: PrismaClient, input: SeedBikeInput) {
  const existing = await prisma.bike.findUnique({
    where: { chipId: input.chipId },
    select: { id: true },
  });

  if (existing) {
    return prisma.bike.update({
      where: { chipId: input.chipId },
      data: {
        stationId: input.stationId,
        status: input.status ?? BikeStatus.AVAILABLE,
        supplierId: input.supplierId ?? null,
        updatedAt: new Date(),
      },
      select: { id: true },
    });
  }

  const [counter] = await prisma.$queryRaw<Array<{ value: bigint }>>`
    SELECT nextval('bike_number_seq')::bigint AS value
  `;

  if (!counter) {
    throw new Error("Failed to get next bike number value");
  }

  return prisma.bike.create({
    data: {
      id: uuidv7(),
      bikeNumber: formatBikeNumber(Number(counter.value)),
      chipId: input.chipId,
      stationId: input.stationId,
      status: input.status ?? BikeStatus.AVAILABLE,
      supplierId: input.supplierId ?? null,
      updatedAt: new Date(),
    },
    select: { id: true },
  });
}

export async function upsertSeedRental(prisma: PrismaClient, input: SeedRentalInput) {
  await prisma.rental.upsert({
    where: { id: input.id },
    update: {
      bikeId: input.bikeId,
      duration: input.duration,
      endStationId: input.endStationId,
      endTime: input.endTime,
      pricingPolicyId: input.pricingPolicyId ?? DEFAULT_PRICING_POLICY_ID,
      startStationId: input.startStationId,
      startTime: input.startTime,
      status: input.status ?? RentalStatus.COMPLETED,
      totalPrice: input.totalPrice,
      updatedAt: new Date(),
      userId: input.userId,
    },
    create: {
      id: input.id,
      bikeId: input.bikeId,
      duration: input.duration,
      endStationId: input.endStationId,
      endTime: input.endTime,
      pricingPolicyId: input.pricingPolicyId ?? DEFAULT_PRICING_POLICY_ID,
      startStationId: input.startStationId,
      startTime: input.startTime,
      status: input.status ?? RentalStatus.COMPLETED,
      totalPrice: input.totalPrice,
      updatedAt: new Date(),
      userId: input.userId,
    },
  });
}

export async function upsertSeedRating(prisma: PrismaClient, input: SeedRatingInput) {
  return prisma.rating.upsert({
    where: { rentalId: input.rentalId },
    update: {
      bikeId: input.bikeId,
      bikeScore: input.bikeScore,
      comment: input.comment,
      stationId: input.stationId,
      stationScore: input.stationScore,
      updatedAt: new Date(),
      userId: input.userId,
    },
    create: {
      id: uuidv7(),
      bikeId: input.bikeId,
      bikeScore: input.bikeScore,
      comment: input.comment,
      rentalId: input.rentalId,
      stationId: input.stationId,
      stationScore: input.stationScore,
      userId: input.userId,
    },
    select: { id: true },
  });
}

export async function replaceSeedRatingReasonLinks(
  prisma: PrismaClient,
  ratingId: string,
  links: readonly SeedRatingReasonLinkInput[],
) {
  await prisma.ratingReasonLink.deleteMany({
    where: { ratingId },
  });

  if (links.length === 0) {
    return;
  }

  await prisma.ratingReasonLink.createMany({
    data: [...links],
    skipDuplicates: true,
  });
}
