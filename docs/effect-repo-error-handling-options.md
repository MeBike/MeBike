# Effect Repo Error Handling Options

## Problem

In `apps/server`, generic repository and transaction errors are frequently treated as defects, but that conversion is repeated manually in the service layer.

Typical pattern today:

```ts
yield* bikeRepo.getById(input.bikeId).pipe(
  Effect.catchTag("BikeRepositoryError", err => Effect.die(err)),
);
```

This appears widely across services and creates a lot of boilerplate.

## Current Observation

- Generic `*RepositoryError` values are usually treated as unrecoverable infra failures.
- `PrismaTransactionError` is also usually treated as unrecoverable.
- Services are manually converting these typed errors into defects over and over.
- Repo error classes are currently standalone `Data.TaggedError(...)` classes, not subclasses of a shared app-level base error.

## Option A: Service-Boundary Helper

Add a shared helper that converts selected typed errors into defects once per service/use-case block.

Example direction:

```ts
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
```

Usage:

```ts
return Effect.gen(function* () {
  const bike = yield* bikeRepo.getById(input.bikeId);
  const station = yield* stationRepo.getById(input.stationId);
  // ...
}).pipe(
  defectOn(
    BikeRepositoryError,
    StationRepositoryError,
    ReservationRepositoryError,
    PrismaTransactionError,
  ),
);
```

Pros:

- Low-risk cleanup
- Much less boilerplate than repeated `catchTag(..., Effect.die)`
- Better than `_tag` string suffix matching if using constructors
- Keeps business errors typed

Cons:

- Repo errors still remain in service error types until the final `defectOn(...)`
- Still a transitional solution, not the cleanest boundary design
- Each service still needs to list its infra constructors

Best for:

- Immediate cleanup with minimal architectural churn

## Option B: Use `Effect.catchTags({...})` Per Block

Instead of a custom helper, use built-in grouped tag handling at the end of a block.

Example:

```ts
effect.pipe(
  Effect.catchTags({
    BikeRepositoryError: Effect.die,
    StationRepositoryError: Effect.die,
    PrismaTransactionError: Effect.die,
  }),
);
```

Pros:

- Pure built-in Effect API
- Explicit and easy to read locally
- No custom helper required

Cons:

- Still repetitive across files
- Still keeps repo errors in service signatures
- Large use cases can accumulate large `catchTags` maps

Best for:

- Small/local cleanup without introducing a helper

## Option C: Repo-Layer Defecting for Generic Infra Failures

Move the conversion down into repository implementations.

Goal:

- Repos only expose meaningful recoverable errors in the typed channel
- Generic infra failures defect before they reach the service layer

Example direction:

From:

```ts
Effect.Effect<UserRow, UserRepositoryError | DuplicateUserEmail>
```

To:

```ts
Effect.Effect<UserRow, DuplicateUserEmail>
```

Pros:

- Cleanest long-term boundary
- Service layer only handles real business/recoverable errors
- Removes boilerplate at the source
- Best alignment with the idea that infra failure is a defect, not a domain outcome

Cons:

- Larger refactor
- Requires auditing which repo errors are genuinely recoverable
- Can ripple through many repo/service signatures and tests

Best for:

- Long-term architectural cleanup

## Option D: Shared Repository Error Base Class

Redesign all `*RepositoryError` classes to share a common app-level base class or marker.

Pros:

- Lets code catch or classify all repo errors through one common parent
- Cleaner than `_tag` string suffix matching

Cons:

- Bigger taxonomy refactor
- Not necessary if generic repo errors should not escape repos at all
- Risks drifting away from the repo's current `Data.TaggedError(...)` style unless done carefully

Best for:

- Cases where infra errors intentionally remain typed across layers

## Recommendation

Recommended phased path:

1. Start with Option A.
2. Use it to clean up the noisiest services first.
3. After that, gradually move toward Option C domain-by-domain.
4. Avoid string suffix matching on `_tag`; prefer constructor-based classification.
5. Only consider Option D if there is a real need to keep generic infra errors typed across multiple layers.

## Suggested First Targets

Good files to clean up first with Option A:

- `apps/server/src/domain/reservations/services/reservation.service.ts`
- `apps/server/src/domain/auth/services/auth.service.ts`
- `apps/server/src/domain/reservations/services/reserve-bike.service.ts`
- `apps/server/src/domain/rentals/services/return-slot.service.ts`
- `apps/server/src/domain/rentals/services/start-rental.service.ts`

## Notes

- `Data.TaggedError(...)` classes are real classes, so constructor-based `instanceof` checks are viable.
- `Effect.catchTags({...})` is the cleanest built-in tool for explicit multi-tag handling.
- There does not appear to be a built-in Effect helper for "all errors in this category" without listing tags or providing a custom predicate/helper.
