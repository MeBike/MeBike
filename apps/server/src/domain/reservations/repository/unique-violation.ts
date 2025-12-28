import { BikeAlreadyReserved } from "../domain-errors";

export { uniqueTargets } from "@/infrastructure/prisma-unique-violation";

export function isActiveBikeReservationTarget(target: string): boolean {
  return (
    target.includes("bike_id")
    || target.includes("bikeId")
    || target.includes("idx_reservations_active_bike")
  );
}

export function mapReservationUniqueViolation(args: {
  readonly constraint: string | string[] | undefined;
  readonly bikeId: string;
}): BikeAlreadyReserved | null {
  const list = Array.isArray(args.constraint)
    ? args.constraint
    : (args.constraint ? [args.constraint] : []);
  const normalized = list.map(String);

  if (normalized.some(isActiveBikeReservationTarget)) {
    return new BikeAlreadyReserved({ bikeId: args.bikeId });
  }

  return null;
}
