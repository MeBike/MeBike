import type { PrismaClient } from "../generated/prisma/client";

export async function seedDefaultSystemConfigs(
  prisma: PrismaClient,
): Promise<void> {
  // Seed default system configurations
  await prisma.systemConfig.upsert({
    where: { key: "min_available_bikes_at_station" },
    update: {},
    create: {
      key: "min_available_bikes_at_station",
      value: "10",
    },
  });
  await prisma.systemConfig.upsert({
    where: { key: "min_bikes_for_redistribution_alert" },
    update: {},
    create: {
      key: "min_bikes_for_redistribution_alert",
      value: "5",
    },
  });
  await prisma.systemConfig.upsert({
    where: { key: "redistribution_pending_expire_hours" },
    update: {},
    create: {
      key: "redistribution_pending_expire_hours",
      value: "24",
    },
  });
}
