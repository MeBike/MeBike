import { Option } from "effect";

import type { RentalServiceFailure } from "../domain-errors";

import { ActiveRentalExists, BikeAlreadyRented } from "../domain-errors";

function normalizeConstraintList(
  constraint: string[] | string | undefined,
): readonly string[] {
  const list = Array.isArray(constraint)
    ? constraint
    : (constraint ? [constraint] : []);
  return list.map(String);
}

export function rentalUniqueViolationToFailure(args: {
  readonly constraint: string[] | string | undefined;
  readonly bikeId: string;
  readonly userId: string;
}): Option.Option<RentalServiceFailure> {
  const normalized = normalizeConstraintList(args.constraint);

  if (
    normalized.includes("bike_id")
    || normalized.includes("bikeId")
    || normalized.includes("idx_rentals_active_bike")
  ) {
    return Option.some(new BikeAlreadyRented({ bikeId: args.bikeId }));
  }

  if (
    normalized.includes("user_id")
    || normalized.includes("userId")
    || normalized.includes("idx_rentals_active_user")
  ) {
    return Option.some(new ActiveRentalExists({ userId: args.userId }));
  }

  return Option.none();
}
