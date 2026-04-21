import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import process from "node:process";
import { uuidv7 } from "uuidv7";

import {
  BikeStatus,
  PrismaClient,
  SupplierStatus,
} from "../generated/prisma/client";
import { formatBikeNumber } from "../src/domain/bikes/bike-number";
import { setBikeNumberSequence } from "../src/domain/bikes/repository/bike.repository.shared";
import logger from "../src/lib/logger";

const BOOSTER_BIKES_PER_STATION = 15;
const BOOSTER_SUPPLIER_NAME = "Demo Reservation Booster";

type StationSnapshot = {
  id: string;
  name: string;
  totalCapacity: number;
  returnSlotLimit: number;
  totalBikes: number;
  availableBikes: number;
  activeReturnSlots: number;
  boosterBikes: number;
};

function getConnectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

function readManagedBikeNumberValue(bikeNumber: string) {
  if (!bikeNumber.startsWith("MB-")) {
    return undefined;
  }

  const value = Number.parseInt(bikeNumber.slice(3), 10);
  return Number.isNaN(value) ? undefined : value;
}

function computeAvailableReturnSlots(station: Pick<StationSnapshot, "totalCapacity" | "returnSlotLimit" | "totalBikes" | "activeReturnSlots">) {
  return Math.max(
    0,
    Math.min(
      station.totalCapacity - station.totalBikes - station.activeReturnSlots,
      station.returnSlotLimit - station.activeReturnSlots,
    ),
  );
}

async function ensureStationsExist(prisma: PrismaClient) {
  const stationCount = await prisma.station.count();
  if (stationCount === 0) {
    throw new Error("No stations found. Run `pnpm seed:demo` before `pnpm seed:demo:flow-bikes`.");
  }
}

async function ensureBoosterSupplier(prisma: PrismaClient) {
  const existing = await prisma.supplier.findFirst({
    where: { name: BOOSTER_SUPPLIER_NAME },
    select: { id: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.supplier.create({
    data: {
      id: uuidv7(),
      name: BOOSTER_SUPPLIER_NAME,
      status: SupplierStatus.ACTIVE,
      updatedAt: new Date(),
    },
    select: { id: true },
  });
}

async function loadStationSnapshots(prisma: PrismaClient, boosterSupplierId: string): Promise<StationSnapshot[]> {
  const stations = await prisma.station.findMany({
    select: {
      id: true,
      name: true,
      totalCapacity: true,
      returnSlotLimit: true,
    },
    orderBy: { name: "asc" },
  });

  const stationIds = stations.map(station => station.id);
  const [bikeCounts, activeReturnSlotCounts, boosterCounts] = await Promise.all([
    prisma.bike.groupBy({
      by: ["stationId", "status"],
      where: {
        stationId: { in: stationIds },
      },
      _count: { _all: true },
    }),
    prisma.returnSlotReservation.groupBy({
      by: ["stationId"],
      where: {
        stationId: { in: stationIds },
        status: "ACTIVE",
      },
      _count: { _all: true },
    }),
    prisma.bike.groupBy({
      by: ["stationId"],
      where: {
        stationId: { in: stationIds },
        supplierId: boosterSupplierId,
      },
      _count: { _all: true },
    }),
  ]);

  const countsByStationId = new Map<string, { totalBikes: number; availableBikes: number }>();
  for (const row of bikeCounts) {
    const stationId = row.stationId;
    if (!stationId) {
      continue;
    }

    const current = countsByStationId.get(stationId) ?? {
      totalBikes: 0,
      availableBikes: 0,
    };

    current.totalBikes += row._count._all;
    if (row.status === BikeStatus.AVAILABLE) {
      current.availableBikes += row._count._all;
    }

    countsByStationId.set(stationId, current);
  }

  const activeReturnSlotsByStationId = new Map(
    activeReturnSlotCounts.map(row => [row.stationId, row._count._all]),
  );
  const boosterCountsByStationId = new Map(
    boosterCounts
      .filter(row => row.stationId !== null)
      .map(row => [row.stationId as string, row._count._all]),
  );

  return stations.map((station) => {
    const bikeCount = countsByStationId.get(station.id) ?? { totalBikes: 0, availableBikes: 0 };
    return {
      id: station.id,
      name: station.name,
      totalCapacity: station.totalCapacity,
      returnSlotLimit: station.returnSlotLimit,
      totalBikes: bikeCount.totalBikes,
      availableBikes: bikeCount.availableBikes,
      activeReturnSlots: activeReturnSlotsByStationId.get(station.id) ?? 0,
      boosterBikes: boosterCountsByStationId.get(station.id) ?? 0,
    };
  });
}

async function main() {
  const connectionString = getConnectionString();
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    await ensureStationsExist(prisma);
    const supplier = await ensureBoosterSupplier(prisma);

    const snapshots = await loadStationSnapshots(prisma, supplier.id);

    const capacityViolations = snapshots
      .map((station) => {
        const bikesToAdd = Math.max(0, BOOSTER_BIKES_PER_STATION - station.boosterBikes);
        return {
          station,
          bikesToAdd,
          projectedTotalBikes: station.totalBikes + bikesToAdd,
        };
      })
      .filter(item => item.projectedTotalBikes + item.station.activeReturnSlots > item.station.totalCapacity);

    if (capacityViolations.length > 0) {
      const details = capacityViolations
        .map(item => `${item.station.name}: projected ${item.projectedTotalBikes}/${item.station.totalCapacity}`)
        .join("; ");
      throw new Error(
        `Cannot add ${BOOSTER_BIKES_PER_STATION} bikes per station without exceeding capacity. `
        + `Reset with \`pnpm seed:demo\` before running this script. Conflicts: ${details}`,
      );
    }

    const existingManagedBikes = await prisma.bike.findMany({
      where: {
        bikeNumber: { startsWith: "MB-" },
      },
      select: { bikeNumber: true },
    });
    const maxExistingManagedBikeNumber = existingManagedBikes.reduce((max, bike) => {
      const numericValue = readManagedBikeNumberValue(bike.bikeNumber);
      return numericValue && numericValue > max ? numericValue : max;
    }, 0);

    const now = new Date();
    let nextBikeNumber = maxExistingManagedBikeNumber;
    const bikesToCreate = snapshots.flatMap((station) => {
      const missingBoosterBikes = Math.max(0, BOOSTER_BIKES_PER_STATION - station.boosterBikes);
      return Array.from({ length: missingBoosterBikes }, () => {
        nextBikeNumber += 1;
        return {
          id: uuidv7(),
          bikeNumber: formatBikeNumber(nextBikeNumber),
          stationId: station.id,
          supplierId: supplier.id,
          status: BikeStatus.AVAILABLE,
          createdAt: now,
          updatedAt: now,
        };
      });
    });

    if (bikesToCreate.length > 0) {
      await prisma.bike.createMany({ data: bikesToCreate });
      await setBikeNumberSequence(prisma, nextBikeNumber);
    }

    await Promise.all(
      snapshots
        .filter(station => station.returnSlotLimit !== station.totalCapacity)
        .map(station =>
          prisma.station.update({
            where: { id: station.id },
            data: {
              returnSlotLimit: station.totalCapacity,
              updatedAt: now,
            },
          })),
    );

    const summary = await loadStationSnapshots(prisma, supplier.id);

    logger.info({
      supplier: BOOSTER_SUPPLIER_NAME,
      addedBikes: bikesToCreate.length,
      stations: summary.length,
    }, "Demo flow bike seed completed");

    for (const station of summary) {
      logger.info({
        station: station.name,
        totalCapacity: station.totalCapacity,
        returnSlotLimit: station.returnSlotLimit,
        totalBikes: station.totalBikes,
        availableBikes: station.availableBikes,
        emptySlots: Math.max(0, station.totalCapacity - station.totalBikes),
        activeReturnSlots: station.activeReturnSlots,
        availableReturnSlots: computeAvailableReturnSlots(station),
        boosterBikes: station.boosterBikes,
      }, "Station demo flow snapshot");
    }
  }
  finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  logger.error({ err: error }, "Demo flow bike seed failed");
  process.exit(1);
});
