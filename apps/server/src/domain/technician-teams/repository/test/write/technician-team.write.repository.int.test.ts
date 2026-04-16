import { describe, expect, it } from "vitest";

import { makeTechnicianTeamCommandRepository } from "@/domain/technician-teams";
import { runEffect } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

describe("technicianTeamWriteRepository Integration", () => {
  const fixture = setupPrismaIntFixture();

  it("create inserts technician team with station snapshot fields", async () => {
    const station = await fixture.factories.station({ name: "Write Team Station" });
    const repo = makeTechnicianTeamCommandRepository(fixture.prisma);

    const created = await runEffect(repo.create({
      name: "Write Team Alpha",
      stationId: station.id,
      availabilityStatus: "AVAILABLE",
    }));

    expect(created.name).toBe("Write Team Alpha");
    expect(created.stationId).toBe(station.id);
    expect(created.stationName).toBe("Write Team Station");
    expect(created.availabilityStatus).toBe("AVAILABLE");
    expect(created.memberCount).toBe(0);
  });
});
