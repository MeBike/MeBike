import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { validateOrgAssignmentForRole } from "../user.policies";

describe("validateOrgAssignmentForRole", () => {
  it("rejects manager without station assignment", async () => {
    const result = await Effect.runPromise(
      validateOrgAssignmentForRole("MANAGER", null).pipe(Effect.either),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("InvalidOrgAssignment");
    }
  });

  it("accepts manager with station assignment", async () => {
    const result = await Effect.runPromise(
      validateOrgAssignmentForRole("MANAGER", {
        stationId: "0195b6c2-e0f0-7a11-8d45-55f3b5f0a001",
      }).pipe(Effect.either),
    );

    expect(result._tag).toBe("Right");
  });
});
