import type { PrismaClient } from "../../generated/prisma/client";

import { SupplierStatus } from "../../generated/prisma/client";
import { seedRatedRentalScenario } from "./rated-rental-scenarios";
import { getRatingReasonPools } from "./rating-reasons";
import { upsertSeedSupplier } from "./seed-factories";

const SEEDED_SUPPLIER_ID = "11111111-1111-4111-8111-111111111112";

const seededRatings = [
  {
    bike: { chipId: "SEED-RATE-001" },
    rating: { bikeScore: 5, stationScore: 4, comment: "Trai nghiem tot, xe van hanh on dinh." },
    rental: {
      id: "11111111-1111-4111-8111-111111111201",
      duration: 32,
      totalPrice: 32000,
    },
    user: {
      email: "seeded-rating-user-1@mebike.local",
      fullName: "Seeded Rating User 01",
      phoneNumber: "0991000001",
    },
  },
  {
    bike: { chipId: "SEED-RATE-002" },
    rating: { bikeScore: 3, stationScore: 5, comment: "Xe di duoc nhung phanh hoi yeu." },
    rental: {
      id: "11111111-1111-4111-8111-111111111202",
      duration: 41,
      totalPrice: 41000,
    },
    user: {
      email: "seeded-rating-user-2@mebike.local",
      fullName: "Seeded Rating User 02",
      phoneNumber: "0991000002",
    },
  },
  {
    bike: { chipId: "SEED-RATE-003" },
    rating: { bikeScore: 4, stationScore: 5, comment: "Tram de tim va tra xe nhanh." },
    rental: {
      id: "11111111-1111-4111-8111-111111111203",
      duration: 27,
      totalPrice: 27000,
    },
    user: {
      email: "seeded-rating-user-3@mebike.local",
      fullName: "Seeded Rating User 03",
      phoneNumber: "0991000003",
    },
  },
] as const;

export async function seedSampleCompletedRatings(prisma: PrismaClient) {
  const stationRows = await prisma.station.findMany({
    orderBy: { name: "asc" },
    select: { id: true },
    take: seededRatings.length,
  });

  if (stationRows.length === 0) {
    return;
  }

  await upsertSeedSupplier(prisma, {
    id: SEEDED_SUPPLIER_ID,
    address: "Ho Chi Minh City",
    contractFee: 0.12,
    name: "Seeded Rating Supplier",
    phoneNumber: "0988000011",
    status: SupplierStatus.ACTIVE,
  });

  const { bikeReasons, stationReasons } = await getRatingReasonPools(prisma);

  for (const [index, seeded] of seededRatings.entries()) {
    const stationId = stationRows[index]?.id ?? stationRows[0]!.id;
    const endTime = new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000);

    await seedRatedRentalScenario(prisma, {
      user: seeded.user,
      bike: seeded.bike,
      rental: {
        ...seeded.rental,
        startTime: new Date(endTime.getTime() - seeded.rental.duration * 60 * 1000),
        endTime,
      },
      rating: seeded.rating,
    }, {
      stationId,
      supplierId: SEEDED_SUPPLIER_ID,
      bikeReasonId: bikeReasons[0]?.id,
      stationReasonId: stationReasons[0]?.id,
    });
  }
}
