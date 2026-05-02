import { beforeAll, describe, expect, it } from "vitest";

import { expectLeftTag } from "@/test/effect/assertions";
import { runEffect, runEffectEither } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

import { makeNfcCardWriteRepository } from "../../write/nfc-card.write.repository";

describe("nfcCardWriteRepository integration", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makeNfcCardWriteRepository>;

  beforeAll(() => {
    repo = makeNfcCardWriteRepository(fixture.prisma);
  });

  it("maps duplicate UID unique constraint to DuplicateNfcCardUid", async () => {
    await runEffect(repo.create({ uid: "123456789" }));

    const result = await runEffectEither(repo.create({ uid: "123456789" }));
    expectLeftTag(result, "DuplicateNfcCardUid");
  });

  it("rejects assigning a second card to the same user", async () => {
    const user = await fixture.factories.user();
    const firstCard = await runEffect(repo.create({ uid: "22334455" }));
    const secondCard = await runEffect(repo.create({ uid: "66778899" }));

    await runEffect(repo.assignToUser({
      nfcCardId: firstCard.id,
      userId: user.id,
      now: new Date("2026-05-02T12:00:00.000Z"),
    }));

    const result = await runEffectEither(repo.assignToUser({
      nfcCardId: secondCard.id,
      userId: user.id,
      now: new Date("2026-05-02T12:05:00.000Z"),
    }));

    expectLeftTag(result, "UserAlreadyHasNfcCard");
  });

  it("enforces one-user-one-card uniqueness at database level", async () => {
    const user = await fixture.factories.user();

    await fixture.prisma.nfcCard.create({
      data: {
        uid: "99887766",
        status: "ACTIVE",
        assignedUserId: user.id,
        issuedAt: new Date("2026-05-02T12:00:00.000Z"),
      },
    });

    await expect(
      fixture.prisma.nfcCard.create({
        data: {
          uid: "44556677",
          status: "ACTIVE",
          assignedUserId: user.id,
          issuedAt: new Date("2026-05-02T12:05:00.000Z"),
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });
});
