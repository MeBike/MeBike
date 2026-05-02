import { Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { expectLeftTag } from "@/test/effect/assertions";
import { runEffect, runEffectEither } from "@/test/effect/run";
import { uniqueEmail } from "@/test/scenarios";

import {
  createUserInput,
  setupUserRepositoryIntTestKit,
} from "../user.repository.int.test-kit";

describe("userWriteRepository Integration", () => {
  const kit = setupUserRepositoryIntTestKit();
  let repo: ReturnType<typeof kit.makeRepo>;

  beforeAll(() => {
    repo = kit.makeRepo();
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

  it("updateProfile ignores privileged fields even if a caller bypasses types", async () => {
    const user = await runEffect(repo.createUser(createUserInput({
      role: "USER",
      accountStatus: "ACTIVE",
      verify: "UNVERIFIED",
    })));

    const result = await runEffect(repo.updateProfile(user.id, {
      fullname: "Updated Self Profile",
      role: "ADMIN",
      accountStatus: "BANNED",
      verify: "VERIFIED",
    } as never));

    expect(Option.isSome(result)).toBe(true);
    if (Option.isNone(result)) {
      throw new Error("Expected updated user");
    }

    expect(result.value.fullname).toBe("Updated Self Profile");
    expect(result.value.role).toBe("USER");
    expect(result.value.accountStatus).toBe("ACTIVE");
    expect(result.value.verify).toBe("UNVERIFIED");
  });

  it("updateAdminById rejects duplicate email", async () => {
    const first = await runEffect(repo.createUser(createUserInput({ email: "one@example.com" })));
    const second = await runEffect(repo.createUser(createUserInput({ email: "two@example.com" })));

    const result = await runEffectEither(repo.updateAdminById(second.id, { email: first.email }));
    expectLeftTag(result, "DuplicateUserEmail");
  });

  it("updateAdminById can update privileged user fields", async () => {
    const user = await runEffect(repo.createUser(createUserInput({
      role: "USER",
      accountStatus: "ACTIVE",
      verify: "UNVERIFIED",
    })));

    const result = await runEffect(repo.updateAdminById(user.id, {
      role: "STAFF",
      accountStatus: "BANNED",
      verify: "VERIFIED",
    }));

    expect(Option.isSome(result)).toBe(true);
    if (Option.isNone(result)) {
      throw new Error("Expected updated user");
    }

    expect(result.value.role).toBe("STAFF");
    expect(result.value.accountStatus).toBe("BANNED");
    expect(result.value.verify).toBe("VERIFIED");
  });

  it("createUser rejects assigning a fourth member to a technician team", async () => {
    const station = await kit.fixture.factories.station({ name: "Repository Team Base" });
    const team = await kit.fixture.factories.technicianTeam({
      name: "Repository Team Full",
      stationId: station.id,
    });

    for (let i = 0; i < 3; i++) {
      const user = await kit.fixture.factories.user({
        role: "TECHNICIAN",
        email: uniqueEmail(`repo-tech-${i}`),
      });

      await kit.fixture.factories.userOrgAssignment({
        userId: user.id,
        technicianTeamId: team.id,
      });
    }

    const result = await runEffectEither(repo.createUser({
      ...createUserInput({
        email: uniqueEmail("repo-tech-overflow"),
        role: "TECHNICIAN",
      }),
      orgAssignment: {
        technicianTeamId: team.id,
      },
    }));

    expectLeftTag(result, "TechnicianTeamMemberLimitExceeded");
  });

  it("updateAdminById rejects assigning a fourth member to a technician team", async () => {
    const station = await kit.fixture.factories.station({ name: "Repository Update Team Base" });
    const team = await kit.fixture.factories.technicianTeam({
      name: "Repository Update Team Full",
      stationId: station.id,
    });

    for (let i = 0; i < 3; i++) {
      const user = await kit.fixture.factories.user({
        role: "TECHNICIAN",
        email: uniqueEmail(`repo-update-tech-${i}`),
      });

      await kit.fixture.factories.userOrgAssignment({
        userId: user.id,
        technicianTeamId: team.id,
      });
    }

    const targetUser = await kit.fixture.factories.user({
      role: "TECHNICIAN",
      email: uniqueEmail("repo-update-target"),
    });

    const result = await runEffectEither(repo.updateAdminById(targetUser.id, {
      role: "TECHNICIAN",
      orgAssignment: {
        technicianTeamId: team.id,
      },
    }));

    expectLeftTag(result, "TechnicianTeamMemberLimitExceeded");
  });

  it("createUser creates user within transaction", async () => {
    const input = createUserInput();

    const created = await kit.fixture.prisma.$transaction(async (tx) => {
      const txRepo = kit.makeRepo(tx);
      return runEffect(txRepo.createUser(input));
    });

    expect(created.email).toBe(input.email);

    const fetched = await runEffect(repo.findById(created.id));
    expect(Option.isSome(fetched)).toBe(true);
  });

  it("createUser rejects duplicate email within transaction", async () => {
    const email = "tx-dup@example.com";
    await runEffect(repo.createUser(createUserInput({ email })));

    const result = await kit.fixture.prisma.$transaction(async (tx) => {
      const txRepo = kit.makeRepo(tx);
      return runEffectEither(txRepo.createUser(createUserInput({ email })));
    });

    expectLeftTag(result, "DuplicateUserEmail");
  });

  it("createUser rejects duplicate phone within transaction", async () => {
    const phoneNumber = "0987654321";
    await runEffect(repo.createUser(createUserInput({ phoneNumber })));

    const result = await kit.fixture.prisma.$transaction(async (tx) => {
      const txRepo = kit.makeRepo(tx);
      return runEffectEither(
        txRepo.createUser(createUserInput({ phoneNumber, email: uniqueEmail("tx") })),
      );
    });

    expectLeftTag(result, "DuplicateUserPhoneNumber");
  });

  it("transaction rollback does not persist earlier create when later create fails", async () => {
    const firstEmail = uniqueEmail("first");
    const duplicateEmail = "existing@example.com";

    await runEffect(repo.createUser(createUserInput({ email: duplicateEmail })));

    try {
      await kit.fixture.prisma.$transaction(async (tx) => {
        const txRepo = kit.makeRepo(tx);
        await runEffect(txRepo.createUser(createUserInput({ email: firstEmail })));
        await runEffect(txRepo.createUser(createUserInput({ email: duplicateEmail })));
      });
      throw new Error("Transaction should have failed");
    }
    catch {
      // Expected.
    }

    const firstUser = await runEffect(repo.findByEmail(firstEmail));
    expect(Option.isNone(firstUser)).toBe(true);
  });

  it("transaction rollback does not persist create when later error is thrown", async () => {
    const email = uniqueEmail("rollback");

    try {
      await kit.fixture.prisma.$transaction(async (tx) => {
        const txRepo = kit.makeRepo(tx);
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
