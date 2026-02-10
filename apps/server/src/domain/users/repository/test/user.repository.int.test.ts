import { PrismaPg } from "@prisma/adapter-pg";
import { Effect, Either, Option } from "effect";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { getTestDatabase } from "@/test/db/test-database";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { PrismaClient } from "generated/prisma/client";

import { makeUserRepository } from "../user.repository";

function createUserInput(overrides?: Partial<{ email: string; phoneNumber: string | null }>) {
  return {
    fullname: "Test User",
    email: overrides?.email ?? `user-${uuidv7()}@example.com`,
    passwordHash: "hash",
    phoneNumber: overrides?.phoneNumber ?? null,
  };
}

describe("userRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let repo: ReturnType<typeof makeUserRepository>;

  beforeAll(async () => {
    container = await getTestDatabase();

    const adapter = new PrismaPg({ connectionString: container.url });
    client = new PrismaClient({ adapter });
    repo = makeUserRepository(client);
  }, 60000);

  afterEach(async () => {
    await client.user.deleteMany({});
  });

  afterAll(async () => {
    if (client)
      await client.$disconnect();
    if (container)
      await container.stop();
  });

  const expectLeftTag = <E extends { _tag: string }>(
    result: Either.Either<unknown, E>,
    tag: E["_tag"],
  ) => {
    if (Either.isRight(result)) {
      throw new Error(`Expected Left ${tag}, got Right`);
    }
    expect(result.left._tag).toBe(tag);
  };

  it("createUser + findById/findByEmail returns the user", async () => {
    const created = await Effect.runPromise(repo.createUser(createUserInput()));

    const byId = await Effect.runPromise(repo.findById(created.id));
    if (Option.isNone(byId)) {
      throw new Error("Expected user to exist");
    }
    expect(byId.value.email).toBe(created.email);

    const byEmail = await Effect.runPromise(repo.findByEmail(created.email));
    if (Option.isNone(byEmail)) {
      throw new Error("Expected user to exist by email");
    }
    expect(byEmail.value.id).toBe(created.id);
  });

  it("findById returns Option.none for missing user", async () => {
    const result = await Effect.runPromise(repo.findById(uuidv7()));
    expect(Option.isNone(result)).toBe(true);
  });

  it("createUser rejects duplicate email", async () => {
    const email = "duplicate@example.com";
    await Effect.runPromise(repo.createUser(createUserInput({ email })));

    const result = await Effect.runPromise(
      repo.createUser(createUserInput({ email })).pipe(Effect.either),
    );

    expectLeftTag(result, "DuplicateUserEmail");
  });

  it("createUser rejects duplicate phone number", async () => {
    const phoneNumber = "0912345678";
    await Effect.runPromise(repo.createUser(createUserInput({ phoneNumber })));

    const result = await Effect.runPromise(
      repo
        .createUser(createUserInput({ phoneNumber, email: `user-${uuidv7()}@example.com` }))
        .pipe(Effect.either),
    );

    expectLeftTag(result, "DuplicateUserPhoneNumber");
  });

  it("updateProfile returns Option.none for missing user", async () => {
    const result = await Effect.runPromise(repo.updateProfile(uuidv7(), { fullname: "Missing" }));
    expect(Option.isNone(result)).toBe(true);
  });

  it("updateAdminById rejects duplicate email", async () => {
    const first = await Effect.runPromise(repo.createUser(createUserInput({ email: "one@example.com" })));
    const second = await Effect.runPromise(repo.createUser(createUserInput({ email: "two@example.com" })));

    const result = await Effect.runPromise(
      repo
        .updateAdminById(second.id, { email: first.email })
        .pipe(Effect.either),
    );

    expectLeftTag(result, "DuplicateUserEmail");
  });

  it("returns UserRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    const brokenRepo = makeUserRepository(broken.client);

    const result = await Effect.runPromise(
      brokenRepo.findById(uuidv7()).pipe(Effect.either),
    );

    expectLeftTag(result, "UserRepositoryError");

    await broken.stop();
  });

  describe("transaction-bound repository", () => {
    it("findById returns user within transaction", async () => {
      const user = await Effect.runPromise(repo.createUser(createUserInput()));

      const result = await client.$transaction(async (tx) => {
        const txRepo = makeUserRepository(tx);
        return Effect.runPromise(txRepo.findById(user.id));
      });

      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect(result.value.id).toBe(user.id);
      }
    });

    it("findById returns Option.none for missing user", async () => {
      const result = await client.$transaction(async (tx) => {
        const txRepo = makeUserRepository(tx);
        return Effect.runPromise(txRepo.findById(uuidv7()));
      });

      expect(Option.isNone(result)).toBe(true);
    });

    it("createUser creates user within transaction", async () => {
      const input = createUserInput();

      const created = await client.$transaction(async (tx) => {
        const txRepo = makeUserRepository(tx);
        return Effect.runPromise(txRepo.createUser(input));
      });

      expect(created.email).toBe(input.email);

      // Verify persisted after commit
      const fetched = await Effect.runPromise(repo.findById(created.id));
      expect(Option.isSome(fetched)).toBe(true);
    });

    it("createUser rejects duplicate email within transaction", async () => {
      const email = "tx-dup@example.com";
      await Effect.runPromise(repo.createUser(createUserInput({ email })));

      const result = await client.$transaction(async (tx) => {
        const txRepo = makeUserRepository(tx);
        return Effect.runPromise(
          txRepo.createUser(createUserInput({ email })).pipe(Effect.either),
        );
      });

      expectLeftTag(result, "DuplicateUserEmail");
    });

    it("createUser rejects duplicate phone within transaction", async () => {
      const phoneNumber = "0987654321";
      await Effect.runPromise(repo.createUser(createUserInput({ phoneNumber })));

      const result = await client.$transaction(async (tx) => {
        const txRepo = makeUserRepository(tx);
        return Effect.runPromise(
          txRepo
            .createUser(createUserInput({ phoneNumber, email: `tx-${uuidv7()}@example.com` }))
            .pipe(Effect.either),
        );
      });

      expectLeftTag(result, "DuplicateUserPhoneNumber");
    });

    it("transaction rollback: first user NOT persisted when second user fails", async () => {
      const firstEmail = `first-${uuidv7()}@example.com`;
      const duplicateEmail = "existing@example.com";

      await Effect.runPromise(repo.createUser(createUserInput({ email: duplicateEmail })));

      try {
        await client.$transaction(async (tx) => {
          const txRepo = makeUserRepository(tx);
          await Effect.runPromise(txRepo.createUser(createUserInput({ email: firstEmail })));

          // Second user - will fail due to duplicate email, causing tx rollback
          await Effect.runPromise(txRepo.createUser(createUserInput({ email: duplicateEmail })));
        });
        throw new Error("Transaction should have failed");
      }

      // eslint-disable-next-line unused-imports/no-unused-vars
      catch (error) {
        // Expected - transaction failed
      }

      // Verify first user was NOT persisted (rollback worked)
      const firstUser = await Effect.runPromise(repo.findByEmail(firstEmail));
      expect(Option.isNone(firstUser)).toBe(true);
    });

    it("transaction rollback: changes NOT persisted when Error thrown after createUser", async () => {
      const email = `rollback-${uuidv7()}@example.com`;

      try {
        await client.$transaction(async (tx) => {
          const txRepo = makeUserRepository(tx);
          await Effect.runPromise(txRepo.createUser(createUserInput({ email })));
          throw new Error("Simulated business logic failure");
        });
        throw new Error("Transaction should have failed");
      }

      // eslint-disable-next-line unused-imports/no-unused-vars
      catch (error) {
        // Expected
      }

      const user = await Effect.runPromise(repo.findByEmail(email));
      expect(Option.isNone(user)).toBe(true);
    });

    it("findById sees uncommitted changes from same transaction", async () => {
      const input = createUserInput();

      const result = await client.$transaction(async (tx) => {
        // Create user in tx
        const txRepo = makeUserRepository(tx);
        const created = await Effect.runPromise(txRepo.createUser(input));

        // Should be able to find it in same tx before commit
        const found = await Effect.runPromise(txRepo.findById(created.id));

        return { created, found };
      });

      expect(Option.isSome(result.found)).toBe(true);
      if (Option.isSome(result.found)) {
        expect(result.found.value.id).toBe(result.created.id);
      }
    });
  });

  describe("stripe Connect methods", () => {
    it("setStripeConnectedAccountId updates user and returns updated row", async () => {
      const user = await Effect.runPromise(repo.createUser(createUserInput()));
      const accountId = `acct_test_${uuidv7().replace(/-/g, "").slice(0, 16)}`;

      const result = await Effect.runPromise(
        repo.setStripeConnectedAccountId(user.id, accountId),
      );

      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect(result.value.stripeConnectedAccountId).toBe(accountId);
      }
    });

    it("setStripeConnectedAccountId returns Option.none for missing user", async () => {
      const result = await Effect.runPromise(
        repo.setStripeConnectedAccountId(uuidv7(), "acct_missing"),
      );

      expect(Option.isNone(result)).toBe(true);
    });

    it("findByStripeConnectedAccountId returns user by account ID", async () => {
      const user = await Effect.runPromise(repo.createUser(createUserInput()));
      const accountId = `acct_test_${uuidv7().replace(/-/g, "").slice(0, 16)}`;

      await Effect.runPromise(repo.setStripeConnectedAccountId(user.id, accountId));

      const result = await Effect.runPromise(
        repo.findByStripeConnectedAccountId(accountId),
      );

      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect(result.value.id).toBe(user.id);
        expect(result.value.stripeConnectedAccountId).toBe(accountId);
      }
    });

    it("findByStripeConnectedAccountId returns Option.none for unknown account", async () => {
      const result = await Effect.runPromise(
        repo.findByStripeConnectedAccountId("acct_nonexistent"),
      );

      expect(Option.isNone(result)).toBe(true);
    });

    it("setStripePayoutsEnabled updates flag and returns updated row", async () => {
      const user = await Effect.runPromise(repo.createUser(createUserInput()));

      const result = await Effect.runPromise(
        repo.setStripePayoutsEnabled(user.id, true),
      );

      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect(result.value.stripePayoutsEnabled).toBe(true);
      }

      // Toggle back to false
      const disabled = await Effect.runPromise(
        repo.setStripePayoutsEnabled(user.id, false),
      );

      expect(Option.isSome(disabled)).toBe(true);
      if (Option.isSome(disabled)) {
        expect(disabled.value.stripePayoutsEnabled).toBe(false);
      }
    });

    it("setStripePayoutsEnabled returns Option.none for missing user", async () => {
      const result = await Effect.runPromise(
        repo.setStripePayoutsEnabled(uuidv7(), true),
      );

      expect(Option.isNone(result)).toBe(true);
    });

    it("setStripePayoutsEnabledByAccountId updates flag and returns true", async () => {
      const user = await Effect.runPromise(repo.createUser(createUserInput()));
      const accountId = `acct_test_${uuidv7().replace(/-/g, "").slice(0, 16)}`;

      await Effect.runPromise(repo.setStripeConnectedAccountId(user.id, accountId));

      const result = await Effect.runPromise(
        repo.setStripePayoutsEnabledByAccountId(accountId, true),
      );

      expect(result).toBe(true);

      // Verify the flag was actually set
      const fetched = await Effect.runPromise(repo.findById(user.id));
      expect(Option.isSome(fetched)).toBe(true);
      if (Option.isSome(fetched)) {
        expect(fetched.value.stripePayoutsEnabled).toBe(true);
      }
    });

    it("setStripePayoutsEnabledByAccountId returns false for unknown account", async () => {
      const result = await Effect.runPromise(
        repo.setStripePayoutsEnabledByAccountId("acct_unknown", true),
      );

      expect(result).toBe(false);
    });
  });
});
