import { uuidv7 } from "uuidv7";
import { describe, expect, it } from "vitest";

import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

describe("job outbox dedupe integration", () => {
  const fixture = setupPrismaIntFixture();

  it("prevents duplicate outbox entries for same type + dedupeKey while active", async () => {
    const dedupeKey = `test:${uuidv7()}`;
    const payload = {
      version: 1,
      reservationId: uuidv7(),
    } as const;

    await fixture.prisma.jobOutbox.create({
      data: {
        type: "reservations.expireHold",
        dedupeKey,
        payload,
        runAt: new Date(),
      },
    });

    await expect(
      fixture.prisma.jobOutbox.create({
        data: {
          type: "reservations.expireHold",
          dedupeKey,
          payload,
          runAt: new Date(),
        },
      }),
    ).rejects.toBeDefined();

    const count = await fixture.prisma.jobOutbox.count({
      where: {
        type: "reservations.expireHold",
        dedupeKey,
      },
    });
    expect(count).toBe(1);
  });
});
