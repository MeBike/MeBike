import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import process from "node:process";
import { uuidv7 } from "uuidv7";

import { AppliesToEnum, PrismaClient, RatingReasonType } from "../generated/prisma/client";
import { upsertVietnamBoundary } from "./seed-geo-boundary";
import { STATION_IDS } from "./seed/station-ids";
import { stations } from "./seed/stations.data";

const ratingReasonsSeed: ReadonlyArray<{
  readonly type: RatingReasonType;
  readonly appliesTo: AppliesToEnum;
  readonly messages: string;
}> = [
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.bike, messages: "Xe chạy êm, vận hành tốt" },
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.bike, messages: "Xe sạch sẽ" },
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.bike, messages: "Xe còn nhiều pin" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.bike, messages: "Phanh chưa tốt" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.bike, messages: "Xe bẩn hoặc có mùi" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.bike, messages: "Pin yếu" },

  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.station, messages: "Trạm dễ tìm" },
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.station, messages: "Trạm gọn gàng, an toàn" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.station, messages: "Trạm khó tìm" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.station, messages: "Trạm đông, khó trả xe" },

  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.app, messages: "Ứng dụng dễ sử dụng" },
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.app, messages: "Định vị và chỉ đường chính xác" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.app, messages: "Ứng dụng chậm hoặc lag" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.app, messages: "Lỗi trong quá trình thuê/trả xe" },
];

async function seedRatingReasons(prisma: PrismaClient) {
  const existing = await prisma.ratingReason.findMany({
    select: {
      type: true,
      appliesTo: true,
      messages: true,
    },
  });

  const existingKeys = new Set(existing.map(item => `${item.type}|${item.appliesTo}|${item.messages}`));

  for (const reason of ratingReasonsSeed) {
    const key = `${reason.type}|${reason.appliesTo}|${reason.messages}`;
    if (existingKeys.has(key)) {
      continue;
    }

    await prisma.ratingReason.create({
      data: {
        id: uuidv7(),
        type: reason.type,
        appliesTo: reason.appliesTo,
        messages: reason.messages,
      },
    });
  }
}

function getConnectionString() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

async function main() {
  const connectionString = getConnectionString();
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  await upsertVietnamBoundary(prisma);

  // Use the actual table name as it exists in the DB ("Station")
  await prisma.$executeRaw`TRUNCATE TABLE "Station" RESTART IDENTITY CASCADE`;

  for (const station of stations) {
    const updatedAt = new Date(station.updatedAt);
    const stationId = STATION_IDS[station.name] ?? uuidv7();
    await prisma.$executeRaw`
      INSERT INTO "Station" (
        "id",
        "name",
        "address",
        "capacity",
        "latitude",
        "longitude",
        "position",
        "updated_at"
      )
      VALUES (
        ${stationId}::uuid,
        ${station.name},
        ${station.address},
        ${station.capacity},
        ${station.latitude},
        ${station.longitude},
        ST_GeogFromText(${`SRID=4326;POINT(${station.longitude} ${station.latitude})`}),
        ${updatedAt}
      )
      ON CONFLICT ("name") DO NOTHING;
    `;
  }

  await seedRatingReasons(prisma);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
