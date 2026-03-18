import { Effect, Match, Option } from "effect";

import type { ActiveRentalExists, RentalRepositoryError } from "../domain-errors";
import type { RentalRepo } from "../repository/rental.repository.types";

import { rentalUniqueViolationToFailure } from "./unique-violation-mapper";

export function startReservedRentalInTx(args: {
  readonly repo: RentalRepo;
  readonly rentalId: string;
  readonly startTime: Date;
  readonly updatedAt: Date;
  readonly subscriptionId: string | null;
  readonly bikeId: string;
  readonly userId: string;
}): Effect.Effect<
  boolean,
  ActiveRentalExists | RentalRepositoryError
> {
  return args.repo.startReservedRental(
    args.rentalId,
    args.startTime,
    args.updatedAt,
    args.subscriptionId,
  ).pipe(
    Effect.catchTag("RentalUniqueViolation", ({ constraint }) => {
      const mapped = rentalUniqueViolationToFailure({
        constraint,
        bikeId: args.bikeId,
        userId: args.userId,
      });

      if (Option.isNone(mapped)) {
        return Effect.die(new Error(
          `Unhandled rental unique constraint while starting reserved rental: ${String(constraint)}`,
        ));
      }

      return Match.value(mapped.value).pipe(
        Match.tag("BikeAlreadyRented", () =>
          Effect.die(new Error(
            `Invariant violated: bike ${args.bikeId} should not be concurrently rented while reservation ${args.rentalId} is being confirmed`,
          ))),
        Match.tag("ActiveRentalExists", err => Effect.fail(err)),
        Match.orElse(unexpected =>
          Effect.die(new Error(
            `Unhandled mapped rental failure while starting reserved rental: ${unexpected._tag}`,
          ))),
      );
    }),
  );
}
