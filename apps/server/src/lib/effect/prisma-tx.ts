import { Data, Effect } from "effect";

export class PrismaTransactionError extends Data.TaggedError("PrismaTransactionError")<{
  readonly cause: unknown;
}> {}

class TxAbort extends Error {
  constructor(readonly payload: unknown) {
    super("TxAbort");
  }
}
// nho nem exception on fail de no con rollback dc thoi la khoi luon
export function runPrismaTransaction<A, E>(
  client: import("generated/prisma/client").PrismaClient,
  run: (
    tx: import("generated/prisma/client").Prisma.TransactionClient,
  ) => Effect.Effect<A, E, never>,
): Effect.Effect<A, E | PrismaTransactionError> {
  return Effect.tryPromise({
    try: () =>
      client.$transaction(async (tx) => {
        const result = await Effect.runPromise(run(tx).pipe(Effect.either));
        if (result._tag === "Left") {
          throw new TxAbort(result.left);
        }
        return result.right;
      }),
    catch: (err) => {
      if (err instanceof TxAbort) {
        return err.payload as E;
      }
      return new PrismaTransactionError({ cause: err });
    },
  });
}
