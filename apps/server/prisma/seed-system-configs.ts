import { PrismaClient } from "../generated/prisma/client";

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
    where: { key: "redistribution_pending_expire_hours" },
    update: {},
    create: {
      key: "redistribution_pending_expire_hours",
      value: "24",
    },
  });
}