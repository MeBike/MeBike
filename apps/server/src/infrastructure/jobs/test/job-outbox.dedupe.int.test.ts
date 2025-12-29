import { PrismaPg } from "@prisma/adapter-pg";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { migrate } from "@/test/db/migrate";
import { startPostgres } from "@/test/db/postgres";
import { PrismaClient } from "generated/prisma/client";

describe("job outbox dedupe integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;

  beforeAll(async () => {
    container = await startPostgres();
    await migrate(container.url);

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
  }, 60000);

  afterEach(async () => {
    await client.jobOutbox.deleteMany({});
  });

  afterAll(async () => {
    if (client)
      await client.$disconnect();
    if (container)
      await container.stop();
  });

  it("prevents duplicate outbox entries for same type + dedupeKey while active", async () => {
    const dedupeKey = `test:${uuidv7()}`;
    const payload = {
      version: 1,
      reservationId: uuidv7(),
    } as const;

    await client.jobOutbox.create({
      data: {
        type: "reservations.expireHold",
        dedupeKey,
        payload,
        runAt: new Date(),
      },
    });

    await expect(
      client.jobOutbox.create({
        data: {
          type: "reservations.expireHold",
          dedupeKey,
          payload,
          runAt: new Date(),
        },
      }),
    ).rejects.toBeDefined();

    const count = await client.jobOutbox.count({
      where: {
        type: "reservations.expireHold",
        dedupeKey,
      },
    });
    expect(count).toBe(1);
  });
});
