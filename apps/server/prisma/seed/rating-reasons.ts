import { uuidv7 } from "uuidv7";

import type { PrismaClient } from "../../generated/prisma/client";

import { AppliesToEnum, RatingReasonType } from "../../generated/prisma/client";

export const ratingReasonsSeed: ReadonlyArray<{
  readonly type: RatingReasonType;
  readonly appliesTo: AppliesToEnum;
  readonly message: string;
}> = [
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.bike, message: "Xe chạy êm, vận hành tốt" },
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.bike, message: "Xe sạch sẽ" },
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.bike, message: "Xe còn nhiều pin" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.bike, message: "Phanh chưa tốt" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.bike, message: "Xe bẩn hoặc có mùi" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.bike, message: "Pin yếu" },

  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.station, message: "Trạm dễ tìm" },
  { type: RatingReasonType.COMPLIMENT, appliesTo: AppliesToEnum.station, message: "Trạm gọn gàng, an toàn" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.station, message: "Trạm khó tìm" },
  { type: RatingReasonType.ISSUE, appliesTo: AppliesToEnum.station, message: "Trạm đông, khó trả xe" },
];

export async function seedRatingReasons(prisma: PrismaClient) {
  const existing = await prisma.ratingReason.findMany({
    select: {
      type: true,
      appliesTo: true,
      message: true,
    },
  });

  const existingKeys = new Set(existing.map(item => `${item.type}|${item.appliesTo}|${item.message}`));

  for (const reason of ratingReasonsSeed) {
    const key = `${reason.type}|${reason.appliesTo}|${reason.message}`;
    if (existingKeys.has(key)) {
      continue;
    }

    await prisma.ratingReason.create({
      data: {
        id: uuidv7(),
        type: reason.type,
        appliesTo: reason.appliesTo,
        message: reason.message,
      },
    });
  }
}

export async function getRatingReasonPools(prisma: PrismaClient) {
  const [bikeReasons, stationReasons] = await Promise.all([
    prisma.ratingReason.findMany({
      where: { appliesTo: AppliesToEnum.bike },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
    prisma.ratingReason.findMany({
      where: { appliesTo: AppliesToEnum.station },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
  ]);

  return { bikeReasons, stationReasons };
}
