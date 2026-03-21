export { uniqueTargets } from "@/infrastructure/prisma-unique-violation";

export function isActiveReturnSlotByRentalTarget(target: string): boolean {
  return (
    target.includes("rental_id")
    || target.includes("rentalId")
    || target.includes("idx_return_slot_reservations_active_rental")
  );
}

export function isKnownReturnSlotUniqueConstraint(
  constraint: string | string[] | undefined,
): boolean {
  const list = Array.isArray(constraint)
    ? constraint
    : (constraint ? [constraint] : []);

  return list.map(String).some(isActiveReturnSlotByRentalTarget);
}
