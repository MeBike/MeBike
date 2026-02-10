import { Context, Data, Effect, Layer, Match, Option } from "effect";
import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

type User = {
  id: string;
  name: string;
};

export class UserNotFound extends Data.TaggedError("UserNotFound")<{ userId: string }> {}

export type UserRepo = {
  findById: (id: string) => Effect.Effect<Option.Option<User>>;
};

export class UserRepoTag extends Context.Tag("examples/UserRepo")<UserRepoTag, UserRepo>() {}

export const UserRepoLive = Layer.succeed(
  UserRepoTag,
  UserRepoTag.of({
    findById: (id) => {
      const data: Record<string, User> = {
        u1: { id: "u1", name: "An" },
        u2: { id: "u2", name: "Binh" },
      };
      return Effect.succeed(Option.fromNullable(data[id] ?? null));
    },
  }),
);

export function getUserOrFail(userId: string) {
  return Effect.gen(function* () {
    const repo = yield* UserRepoTag;
    const userOpt = yield* repo.findById(userId);

    return yield* Match.value(userOpt).pipe(
      Match.tag("Some", ({ value }) => Effect.succeed(value)),
      Match.tag("None", () => Effect.fail(new UserNotFound({ userId }))),
      Match.exhaustive,
    );
  }).pipe(Effect.provide(UserRepoLive));
}

async function main() {
  const userId = process.argv[2] ?? "";
  const result = await Effect.runPromise(
    getUserOrFail(userId).pipe(
      Effect.match({
        onSuccess: u => `Tìm thấy user: ${u.id} (${u.name})`,
        onFailure: (e) => {
          if (e._tag === "UserNotFound") {
            return `Không tìm thấy user: ${e.userId}`;
          }
          return "Lỗi không xác định";
        },
      }),
    ),
  );

  process.stdout.write(`${result}\n`);
}

const isMain = fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "");
if (isMain) {
  void main();
}
