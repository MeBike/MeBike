import type { UserRow } from "@/domain/users";

export function hasActiveAgencyAccess(
  user: Pick<UserRow, "role" | "orgAssignment">,
): boolean {
  if (user.role !== "AGENCY") {
    return true;
  }

  return user.orgAssignment?.agency?.status === "ACTIVE";
}
