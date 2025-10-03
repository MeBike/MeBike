import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const filePath = path.join(__dirname, "data", "stations.json");
  const stations = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  for (const station of stations) {
    await prisma.station.create({
      data: {
        name: station.name,
        address: station.address,
        latitude: station.latitude,
        longitude: station.longitude,
      },
    });
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
