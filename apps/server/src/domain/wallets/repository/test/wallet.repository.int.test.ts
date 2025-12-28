import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { migrate } from "@/test/db/migrate";
import { startPostgres } from "@/test/db/postgres";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { Prisma, PrismaClient } from "generated/prisma/client";

import { makeWalletRepository } from "../wallet.repository";

describe("walletRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let repo: ReturnType<typeof makeWalletRepository>;

  beforeAll(async () => {
    container = await startPostgres();
    await migrate(container.url);

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
    repo = makeWalletRepository(client);
  }, 60000);

  afterEach(async () => {
    await client.walletTransaction.deleteMany({});
    await client.wallet.deleteMany({});
    await client.user.deleteMany({});
  });

  afterAll(async () => {
    if (client)
      await client.$disconnect();
    if (container)
      await container.stop();
  });

  const createUser = async () => {
    const id = uuidv7();
    await client.user.create({
      data: {
        id,
        fullname: "Wallet User",
        email: `user-${id}@example.com`,
        passwordHash: "hash",
        role: "USER",
        verify: "VERIFIED",
      },
    });
    return { id };
  };

  const expectLeftTag = <E extends { _tag: string }>(
    result: Either.Either<unknown, E>,
    tag: E["_tag"],
  ) => {
    if (Either.isRight(result)) {
      throw new Error(`Expected Left ${tag}, got Right`);
    }
    expect(result.left._tag).toBe(tag);
  };

  it("createForUser creates a wallet", async () => {
    const { id: userId } = await createUser();

    const wallet = await Effect.runPromise(repo.createForUser(userId));
    expect(wallet.userId).toBe(userId);

    const found = await Effect.runPromise(repo.findByUserId(userId));
    expect(Option.isSome(found)).toBe(true);
  });

  it("createForUser rejects duplicate wallet", async () => {
    const { id: userId } = await createUser();
    await Effect.runPromise(repo.createForUser(userId));

    const result = await Effect.runPromise(
      repo.createForUser(userId).pipe(Effect.either),
    );

    expectLeftTag(result, "WalletUniqueViolation");
  });

  it("increaseBalance and decreaseBalance adjust balance", async () => {
    const { id: userId } = await createUser();
    await Effect.runPromise(repo.createForUser(userId));

    const increased = await Effect.runPromise(
      repo.increaseBalance({ userId, amount: new Prisma.Decimal("100.00") }),
    );
    expect(increased.balance.toString()).toBe("100");

    const decreased = await Effect.runPromise(
      repo.decreaseBalance({ userId, amount: new Prisma.Decimal("30.00") }),
    );
    expect(decreased.balance.toString()).toBe("70");

    const transactions = await Effect.runPromise(
      repo.listTransactions(decreased.id, { page: 1, pageSize: 10, sortBy: "createdAt", sortDir: "desc" }),
    );
    expect(transactions.items).toHaveLength(2);
  });

  it("increaseBalance fails when wallet is missing", async () => {
    const result = await Effect.runPromise(
      repo.increaseBalance({ userId: uuidv7(), amount: new Prisma.Decimal("50.00") }).pipe(Effect.either),
    );

    expectLeftTag(result, "WalletRecordNotFound");
  });

  it("increaseBalance returns WalletUniqueViolation for duplicate hash", async () => {
    const { id: userId } = await createUser();
    await Effect.runPromise(repo.createForUser(userId));

    const hash = `refund:reservation:${uuidv7()}`;
    await Effect.runPromise(
      repo.increaseBalance({
        userId,
        amount: new Prisma.Decimal("25.00"),
        hash,
        type: "REFUND",
      }),
    );

    const result = await Effect.runPromise(
      repo.increaseBalance({
        userId,
        amount: new Prisma.Decimal("25.00"),
        hash,
        type: "REFUND",
      }).pipe(Effect.either),
    );

    expectLeftTag(result, "WalletUniqueViolation");
  });

  it("decreaseBalance fails when balance is insufficient", async () => {
    const { id: userId } = await createUser();
    await Effect.runPromise(repo.createForUser(userId));

    const result = await Effect.runPromise(
      repo.decreaseBalance({ userId, amount: new Prisma.Decimal("10.00") }).pipe(Effect.either),
    );

    expectLeftTag(result, "WalletBalanceConstraint");
  });

  it("returns WalletRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    const brokenRepo = makeWalletRepository(broken.client);

    const result = await Effect.runPromise(
      brokenRepo.findByUserId(uuidv7()).pipe(Effect.either),
    );

    expectLeftTag(result, "WalletRepositoryError");

    await broken.stop();
  });
});
