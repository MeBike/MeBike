import { Effect, Either, Option } from "effect";
import { PrismaPg } from "@prisma/adapter-pg";
import { uuidv7 } from "uuidv7";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { migrate } from "@/test/db/migrate";
import { startPostgres } from "@/test/db/postgres";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { PrismaClient } from "generated/prisma/client";

import { makeUserRepository } from "../user.repository";

const createUserInput = (overrides?: Partial<{ email: string; phoneNumber: string | null }>) => ({
  fullname: "Test User",
  email: overrides?.email ?? `user-${uuidv7()}@example.com`,
  passwordHash: "hash",
  phoneNumber: overrides?.phoneNumber ?? null,
});

describe("userRepository Integration", () => {
  let container: { stop: () => Promise<void>; url: string };
  let client: PrismaClient;
  let repo: ReturnType<typeof makeUserRepository>;

  beforeAll(async () => {
    container = await startPostgres();
    await migrate(container.url);

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
});
