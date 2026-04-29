import { Effect, Option } from "effect";
import { describe, expect, it } from "vitest";

import { makeValidateOrgAssignmentTargetsExist } from "../user-org-assignment.validation";

describe("makeValidateOrgAssignmentTargetsExist", () => {
  it("fails when station assignment points to a missing station", async () => {
    const validate = makeValidateOrgAssignmentTargetsExist({
      agencyRepo: {
        getById: () => Effect.succeed(Option.some({} as never)),
      },
      stationRepo: {
        getById: () => Effect.succeed(Option.none()),
      },
      technicianTeamQueryRepo: {
        getById: () => Effect.succeed(Option.some({} as never)),
      },
    });

    const result = await Effect.runPromise(validate({
      role: "MANAGER",
      stationId: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2210",
      technicianTeamId: null,
      agencyId: null,
    }).pipe(Effect.either));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("InvalidOrgAssignment");
    }
  });

  it("fails when technician assignment points to a missing team", async () => {
    const validate = makeValidateOrgAssignmentTargetsExist({
      agencyRepo: {
        getById: () => Effect.succeed(Option.some({} as never)),
      },
      stationRepo: {
        getById: () => Effect.succeed(Option.none()),
      },
      technicianTeamQueryRepo: {
        getById: () => Effect.succeed(Option.none()),
      },
    });

    const result = await Effect.runPromise(validate({
      role: "TECHNICIAN",
      stationId: null,
      technicianTeamId: "019d4781-6843-75e0-a223-16279751efab",
      agencyId: null,
    }).pipe(Effect.either));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("InvalidOrgAssignment");
    }
  });

  it("fails when agency assignment points to a missing agency", async () => {
    const validate = makeValidateOrgAssignmentTargetsExist({
      agencyRepo: {
        getById: () => Effect.succeed(Option.none()),
      },
      stationRepo: {
        getById: () => Effect.succeed(Option.some({} as never)),
      },
      technicianTeamQueryRepo: {
        getById: () => Effect.succeed(Option.some({} as never)),
      },
    });

    const result = await Effect.runPromise(validate({
      role: "AGENCY",
      stationId: null,
      technicianTeamId: null,
      agencyId: "019d4781-6843-75e0-a223-16279751efab",
    }).pipe(Effect.either));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("InvalidOrgAssignment");
    }
  });

  it("fails when staff or manager assignment points to an agency station", async () => {
    const validate = makeValidateOrgAssignmentTargetsExist({
      agencyRepo: {
        getById: () => Effect.succeed(Option.some({} as never)),
      },
      stationRepo: {
        getById: () => Effect.succeed(Option.some({ stationType: "AGENCY", agencyId: "agency-1" } as never)),
      },
      technicianTeamQueryRepo: {
        getById: () => Effect.succeed(Option.some({ stationId: "station-1" } as never)),
      },
    });

    const result = await Effect.runPromise(validate({
      role: "STAFF",
      stationId: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2210",
      technicianTeamId: null,
      agencyId: null,
    }).pipe(Effect.either));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("InvalidOrgAssignment");
    }
  });

  it("fails when technician assignment points to a team under an agency station", async () => {
    const validate = makeValidateOrgAssignmentTargetsExist({
      agencyRepo: {
        getById: () => Effect.succeed(Option.some({} as never)),
      },
      stationRepo: {
        getById: () => Effect.succeed(Option.some({ stationType: "AGENCY", agencyId: "agency-1" } as never)),
      },
      technicianTeamQueryRepo: {
        getById: () => Effect.succeed(Option.some({ stationId: "station-1" } as never)),
      },
    });

    const result = await Effect.runPromise(validate({
      role: "TECHNICIAN",
      stationId: null,
      technicianTeamId: "019d4781-6843-75e0-a223-16279751efab",
      agencyId: null,
    }).pipe(Effect.either));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("InvalidOrgAssignment");
    }
  });

  it("passes when referenced org assignment targets exist", async () => {
    const validate = makeValidateOrgAssignmentTargetsExist({
      agencyRepo: {
        getById: () => Effect.succeed(Option.some({} as never)),
      },
      stationRepo: {
        getById: () => Effect.succeed(Option.some({ stationType: "INTERNAL", agencyId: null } as never)),
      },
      technicianTeamQueryRepo: {
        getById: () => Effect.succeed(Option.some({ stationId: "station-1" } as never)),
      },
    });

    const result = await Effect.runPromise(validate({
      role: "TECHNICIAN",
      stationId: null,
      technicianTeamId: "019d4781-6843-75e0-a223-16279751efab",
      agencyId: null,
    }).pipe(Effect.either));

    expect(result._tag).toBe("Right");
  });
});
