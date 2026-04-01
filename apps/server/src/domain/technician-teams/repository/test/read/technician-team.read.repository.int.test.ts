import { Option } from "effect";
import { uuidv7 } from "uuidv7";
import { describe, expect, it } from "vitest";

import { makeTechnicianTeamQueryRepository } from "@/domain/technician-teams";
import { runEffect } from "@/test/effect/run";
import { setupPrismaIntFixture } from "@/test/prisma/prisma-int-fixture";

describe("technicianTeamReadRepository Integration", () => {
  const fixture = setupPrismaIntFixture();

  it("getById returns the technician team and none for missing id", async () => {
    const station = await fixture.factories.station({ name: "Tech Team Read Station" });
    const team = await fixture.factories.technicianTeam({
      name: "Tech Team Read",
      stationId: station.id,
    });
    const repo = makeTechnicianTeamQueryRepository(fixture.prisma);

    const found = await runEffect(repo.getById(team.id));
    const missing = await runEffect(repo.getById(uuidv7()));

    expect(Option.isSome(found)).toBe(true);
    if (Option.isSome(found)) {
      expect(found.value.id).toBe(team.id);
      expect(found.value.stationId).toBe(station.id);
    }
    expect(Option.isNone(missing)).toBe(true);
  });

  it("countMembers counts members and supports exclusion", async () => {
    const station = await fixture.factories.station({ name: "Tech Team Member Station" });
    const team = await fixture.factories.technicianTeam({
      name: "Tech Team Members",
      stationId: station.id,
    });
    const first = await fixture.factories.user({
      role: "TECHNICIAN",
      email: "tech-team-members-1@example.com",
    });
    const second = await fixture.factories.user({
      role: "TECHNICIAN",
      email: "tech-team-members-2@example.com",
    });
    const repo = makeTechnicianTeamQueryRepository(fixture.prisma);

    await fixture.factories.userOrgAssignment({
      userId: first.id,
      technicianTeamId: team.id,
    });
    await fixture.factories.userOrgAssignment({
      userId: second.id,
      technicianTeamId: team.id,
    });

    const count = await runEffect(repo.countMembers(team.id));
    const excludedCount = await runEffect(repo.countMembers(team.id, {
      excludeUserId: first.id,
    }));

    expect(count).toBe(2);
    expect(excludedCount).toBe(1);
  });

  it("listAvailable omits full and unavailable teams and supports station filter", async () => {
    const stationA = await fixture.factories.station({ name: "Tech Team Station A" });
    const stationB = await fixture.factories.station({ name: "Tech Team Station B" });
    const availableTeam = await fixture.factories.technicianTeam({
      name: "Available Tech Team",
      stationId: stationA.id,
    });
    const fullTeam = await fixture.factories.technicianTeam({
      name: "Full Tech Team",
      stationId: stationA.id,
    });
    await fixture.factories.technicianTeam({
      name: "Unavailable Tech Team",
      stationId: stationA.id,
      availabilityStatus: "UNAVAILABLE",
    });
    const otherStationTeam = await fixture.factories.technicianTeam({
      name: "Other Station Tech Team",
      stationId: stationB.id,
    });
    const repo = makeTechnicianTeamQueryRepository(fixture.prisma);

    for (let i = 0; i < 3; i++) {
      const user = await fixture.factories.user({
        role: "TECHNICIAN",
        email: `full-tech-team-${i}@example.com`,
      });
      await fixture.factories.userOrgAssignment({
        userId: user.id,
        technicianTeamId: fullTeam.id,
      });
    }

    const allTeams = await runEffect(repo.listAvailable());
    const filteredTeams = await runEffect(repo.listAvailable({
      stationId: stationA.id,
    }));

    expect(allTeams.map(item => item.id)).toContain(availableTeam.id);
    expect(allTeams.map(item => item.id)).toContain(otherStationTeam.id);
    expect(allTeams.map(item => item.id)).not.toContain(fullTeam.id);

    expect(filteredTeams.map(item => item.id)).toContain(availableTeam.id);
    expect(filteredTeams.map(item => item.id)).not.toContain(otherStationTeam.id);
    expect(filteredTeams.map(item => item.id)).not.toContain(fullTeam.id);
  });
});
