import { Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { expectLeftTag } from "@/test/effect/assertions";
import { runEffect, runEffectEither } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";
import { uniqueEmail } from "@/test/scenarios";

import { makeUserRepository } from "../user.repository";

function createUserInput(overrides?: Partial<{ email: string; phoneNumber: string | null }>) {
  return {
    fullname: "Test User",
    email: overrides?.email ?? uniqueEmail("user"),
    passwordHash: "hash",
    phoneNumber: overrides?.phoneNumber ?? null,
  };
}

describe("userRepository Integration", () => {
  const fixture = setupPrismaIntFixture();
  let repo: ReturnType<typeof makeUserRepository>;

  beforeAll(() => {
    repo = makeUserRepository(fixture.prisma);
  });

  it("createUser + findById/findByEmail returns the user", async () => {
    const created = await runEffect(repo.createUser(createUserInput()));

    const byId = await runEffect(repo.findById(created.id));
    if (Option.isNone(byId)) {
      throw new Error("Expected user to exist");
    }
    expect(byId.value.email).toBe(created.email);

    const byEmail = await runEffect(repo.findByEmail(created.email));
    if (Option.isNone(byEmail)) {
      throw new Error("Expected user to exist by email");
    }
    expect(byEmail.value.id).toBe(created.id);
  });

  it("findById returns Option.none for missing user", async () => {
    const result = await runEffect(repo.findById(uuidv7()));
    expect(Option.isNone(result)).toBe(true);
  });

  it("createUser rejects duplicate email", async () => {
    const email = "duplicate@example.com";
    await runEffect(repo.createUser(createUserInput({ email })));

    const result = await runEffectEither(repo.createUser(createUserInput({ email })));
    expectLeftTag(result, "DuplicateUserEmail");
  });

  it("createUser rejects duplicate phone number", async () => {
    const phoneNumber = "0912345678";
    await runEffect(repo.createUser(createUserInput({ phoneNumber })));

    const result = await runEffectEither(
      repo.createUser(createUserInput({ phoneNumber, email: uniqueEmail("phone") })),
    );

    expectLeftTag(result, "DuplicateUserPhoneNumber");
  });

  it("updateProfile returns Option.none for missing user", async () => {
    const result = await runEffect(repo.updateProfile(uuidv7(), { fullname: "Missing" }));
    expect(Option.isNone(result)).toBe(true);
  });

  it("updateAdminById rejects duplicate email", async () => {
    const first = await runEffect(repo.createUser(createUserInput({ email: "one@example.com" })));
    const second = await runEffect(repo.createUser(createUserInput({ email: "two@example.com" })));

    const result = await runEffectEither(repo.updateAdminById(second.id, { email: first.email }));
    expectLeftTag(result, "DuplicateUserEmail");
  });

  it("returns UserRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    const brokenRepo = makeUserRepository(broken.client);

    const result = await runEffectEither(brokenRepo.findById(uuidv7()));
    expectLeftTag(result, "UserRepositoryError");

    await broken.stop();
  });

  describe("transaction-bound repository", () => {
    it("findById returns user within transaction", async () => {
      const user = await runEffect(repo.createUser(createUserInput()));

      const result = await fixture.prisma.$transaction(async (tx) => {
        const txRepo = makeUserRepository(tx);
        return runEffect(txRepo.findById(user.id));
      });

      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect(result.value.id).toBe(user.id);
      }
    });

    it("findById returns Option.none for missing user", async () => {
      const result = await fixture.prisma.$transaction(async (tx) => {
        const txRepo = makeUserRepository(tx);
        return runEffect(txRepo.findById(uuidv7()));
      });

      expect(Option.isNone(result)).toBe(true);
    });

    it("createUser creates user within transaction", async () => {
      const input = createUserInput();

      const created = await fixture.prisma.$transaction(async (tx) => {
        const txRepo = makeUserRepository(tx);
        return runEffect(txRepo.createUser(input));
      });

      expect(created.email).toBe(input.email);

      const fetched = await runEffect(repo.findById(created.id));
      expect(Option.isSome(fetched)).toBe(true);
    });

    it("createUser rejects duplicate email within transaction", async () => {
      const email = "tx-dup@example.com";
      await runEffect(repo.createUser(createUserInput({ email })));

      const result = await fixture.prisma.$transaction(async (tx) => {
        const txRepo = makeUserRepository(tx);
        return runEffectEither(txRepo.createUser(createUserInput({ email })));
      });

      expectLeftTag(result, "DuplicateUserEmail");
    });

    it("createUser rejects duplicate phone within transaction", async () => {
      const phoneNumber = "0987654321";
      await runEffect(repo.createUser(createUserInput({ phoneNumber })));

      const result = await fixture.prisma.$transaction(async (tx) => {
        const txRepo = makeUserRepository(tx);
        return runEffectEither(
          txRepo.createUser(createUserInput({ phoneNumber, email: uniqueEmail("tx") })),
        );
      });

      expectLeftTag(result, "DuplicateUserPhoneNumber");
    });

    it("transaction rollback: first user NOT persisted when second user fails", async () => {
      const firstEmail = uniqueEmail("first");
      const duplicateEmail = "existing@example.com";

      await runEffect(repo.createUser(createUserInput({ email: duplicateEmail })));

      try {
        await fixture.prisma.$transaction(async (tx) => {
          const txRepo = makeUserRepository(tx);
          await runEffect(txRepo.createUser(createUserInput({ email: firstEmail })));
          await runEffect(txRepo.createUser(createUserInput({ email: duplicateEmail })));
        });
        throw new Error("Transaction should have failed");
      }
      catch {
        // Expected - transaction failed.
      }

      const firstUser = await runEffect(repo.findByEmail(firstEmail));
      expect(Option.isNone(firstUser)).toBe(true);
    });

    it("transaction rollback: changes NOT persisted when Error thrown after createUser", async () => {
      const email = uniqueEmail("rollback");

      try {
        await fixture.prisma.$transaction(async (tx) => {
          const txRepo = makeUserRepository(tx);
          await runEffect(txRepo.createUser(createUserInput({ email })));
          throw new Error("Simulated business logic failure");
        });
        throw new Error("Transaction should have failed");
      }
      catch {
        // Expected.
      }

      const user = await runEffect(repo.findByEmail(email));
      expect(Option.isNone(user)).toBe(true);
    });

    it("findById sees uncommitted changes from same transaction", async () => {
      const input = createUserInput();

      const result = await fixture.prisma.$transaction(async (tx) => {
        const txRepo = makeUserRepository(tx);
        const created = await runEffect(txRepo.createUser(input));
        const found = await runEffect(txRepo.findById(created.id));

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
      const user = await runEffect(repo.createUser(createUserInput()));
      const accountId = `acct_test_${uuidv7().replace(/-/g, "").slice(0, 16)}`;

      const result = await runEffect(repo.setStripeConnectedAccountId(user.id, accountId));

      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect(result.value.stripeConnectedAccountId).toBe(accountId);
      }
    });

    it("setStripeConnectedAccountId returns Option.none for missing user", async () => {
      const result = await runEffect(repo.setStripeConnectedAccountId(uuidv7(), "acct_missing"));
      expect(Option.isNone(result)).toBe(true);
    });

    it("findByStripeConnectedAccountId returns user by account ID", async () => {
      const user = await runEffect(repo.createUser(createUserInput()));
      const accountId = `acct_test_${uuidv7().replace(/-/g, "").slice(0, 16)}`;

      await runEffect(repo.setStripeConnectedAccountId(user.id, accountId));

      const result = await runEffect(repo.findByStripeConnectedAccountId(accountId));

      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect(result.value.id).toBe(user.id);
        expect(result.value.stripeConnectedAccountId).toBe(accountId);
      }
    });

    it("findByStripeConnectedAccountId returns Option.none for unknown account", async () => {
      const result = await runEffect(repo.findByStripeConnectedAccountId("acct_nonexistent"));
      expect(Option.isNone(result)).toBe(true);
    });

    it("setStripePayoutsEnabled updates flag and returns updated row", async () => {
      const user = await runEffect(repo.createUser(createUserInput()));

      const result = await runEffect(repo.setStripePayoutsEnabled(user.id, true));

      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect(result.value.stripePayoutsEnabled).toBe(true);
      }

      const disabled = await runEffect(repo.setStripePayoutsEnabled(user.id, false));

      expect(Option.isSome(disabled)).toBe(true);
      if (Option.isSome(disabled)) {
        expect(disabled.value.stripePayoutsEnabled).toBe(false);
      }
    });

    it("setStripePayoutsEnabled returns Option.none for missing user", async () => {
      const result = await runEffect(repo.setStripePayoutsEnabled(uuidv7(), true));
      expect(Option.isNone(result)).toBe(true);
    });

    it("setStripePayoutsEnabledByAccountId updates flag and returns true", async () => {
      const user = await runEffect(repo.createUser(createUserInput()));
      const accountId = `acct_test_${uuidv7().replace(/-/g, "").slice(0, 16)}`;

      await runEffect(repo.setStripeConnectedAccountId(user.id, accountId));

      const result = await runEffect(repo.setStripePayoutsEnabledByAccountId(accountId, true));
      expect(result).toBe(true);

      const updated = await runEffect(repo.findById(user.id));
      expect(Option.isSome(updated)).toBe(true);
      if (Option.isSome(updated)) {
        expect(updated.value.stripePayoutsEnabled).toBe(true);
      }
    });

    it("setStripePayoutsEnabledByAccountId returns false for unknown account", async () => {
      const result = await runEffect(repo.setStripePayoutsEnabledByAccountId("acct_unknown", true));
      expect(result).toBe(false);
    });
  });
});
