import { Effect } from "effect";

type ErrorCtor<E> = abstract new (...args: never[]) => E;

export function defectOn<const Ctors extends readonly ErrorCtor<any>[]>(...ctors: Ctors) {
  return <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<
    A,
    Exclude<E, InstanceType<Ctors[number]>>,
    R
  > =>
    effect.pipe(
      Effect.catchAll(error =>
        ctors.some(Ctor => error instanceof Ctor)
          ? Effect.die(error)
          : Effect.fail(error as Exclude<E, InstanceType<Ctors[number]>>),
      ),
    );
}
