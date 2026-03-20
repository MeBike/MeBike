import type { Layer } from "effect";

import { Effect } from "effect";

export function runEffect<A, E>(effect: Effect.Effect<A, E, never>) {
  return Effect.runPromise(effect);
}

export function runEffectEither<A, E>(effect: Effect.Effect<A, E, never>) {
  return Effect.runPromise(effect.pipe(Effect.either));
}

export function runEffectWithLayer<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  layer: Layer.Layer<R>,
) {
  return Effect.runPromise(effect.pipe(Effect.provide(layer)) as Effect.Effect<A, E, never>);
}

export function runEffectEitherWithLayer<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  layer: Layer.Layer<R>,
) {
  return Effect.runPromise(effect.pipe(Effect.provide(layer), Effect.either) as Effect.Effect<
    import("effect/Either").Either<A, E>,
    never,
    never
  >);
}
