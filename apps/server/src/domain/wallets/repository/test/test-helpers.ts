import { PrismaPg } from "@prisma/adapter-pg";
import { Either } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll } from "vitest";

import { migrate } from "@/test/db/migrate";
import { startPostgres } from "@/test/db/postgres";
import { PrismaClient } from "generated/prisma/client";

import { makeWalletRepository } from "../wallet.repository";

export function setupWalletRepositoryTests() {
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
    if (result.left._tag !== tag) {
      throw new Error(`Expected Left ${tag}, got ${result.left._tag}`);
    }
  };

  return {
    getClient: () => client,
    getRepo: () => repo,
    createUser,
    expectLeftTag,
  };
}
