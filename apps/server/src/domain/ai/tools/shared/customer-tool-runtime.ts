import { Cause, Effect, Exit } from "effect";

type ActionFailureShape = {
  ok: false;
  error: {
    code: string;
    kind: string;
    retryable: boolean;
    suggestedAction: string;
    userMessage: string;
  };
};

export function createActionFailure<T extends ActionFailureShape>(
  code: T["error"]["code"],
  kind: T["error"]["kind"],
  retryable: boolean,
  suggestedAction: T["error"]["suggestedAction"],
  userMessage: string,
): T {
  return {
    ok: false,
    error: {
      code,
      kind,
      retryable,
      suggestedAction,
      userMessage,
    },
  } as T;
}

export async function runActionTool<A, E, O>(args: {
  defectMessage: string;
  effect: Effect.Effect<A, E>;
  mapSuccess: (value: A) => Promise<O> | O;
}): Promise<O | E> {
  const exit = await Effect.runPromiseExit(args.effect);

  if (Exit.isSuccess(exit)) {
    return await args.mapSuccess(exit.value);
  }

  if (Cause.isFailType(exit.cause)) {
    return exit.cause.error;
  }

  throw new Error(args.defectMessage);
}
