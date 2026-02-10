import { Cause, Context, Data, Effect, Exit, Layer, Match } from "effect";
import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export class NameRequired extends Data.TaggedError("NameRequired")<{
  field: string;
}> {}

export type GreeterService = {
  greet: (name: string) => Effect.Effect<string, NameRequired>;
};

export class Greeter extends Context.Tag("examples/Greeter")<Greeter, GreeterService>() {}

export const GreeterLive = Layer.succeed(
  Greeter,
  Greeter.of({
    greet: (name) => {
      const trimmed = name.trim();
      return trimmed.length > 0
        ? Effect.succeed(`Xin chào, ${trimmed}!`)
        : Effect.fail(new NameRequired({ field: "name" }));
    },
  }),
);

export function greetProgram(name: string) {
  return Effect.gen(function* () {
    const greeter = yield* Greeter;
    return yield* greeter.greet(name);
  }).pipe(Effect.provide(GreeterLive));
}

async function main() {
  const name = process.argv[2] ?? "";
  const exit = await Effect.runPromiseExit(greetProgram(name));

  if (Exit.isSuccess(exit)) {
    process.stdout.write(`${exit.value}\n`);
    return;
  }

  const cause = exit.cause;

  if (Cause.isFailType(cause)) {
    const err = cause.error as NameRequired;
    const message = Match.value(err).pipe(
      Match.tag("NameRequired", e => `Thiếu trường bắt buộc: ${e.field}`),
      Match.orElse(() => "Lỗi không xác định"),
    );
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
    return;
  }

  // Defect / interrupt
  process.stderr.write(`${Cause.pretty(cause)}\n`);
  process.exitCode = 1;
}

const isMain = fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? "");
if (isMain) {
  void main();
}
