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

  it("list returns technician teams with filters and member counts", async () => {
    const stationA = await fixture.factories.station({ name: "List Team Station A" });
    const stationB = await fixture.factories.station({ name: "List Team Station B" });
    const availableTeam = await fixture.factories.technicianTeam({
      name: "List Available Team",
      stationId: stationA.id,
    });
    await fixture.factories.technicianTeam({
      name: "List Unavailable Team",
      stationId: stationB.id,
      availabilityStatus: "UNAVAILABLE",
    });
    const technician = await fixture.factories.user({
      role: "TECHNICIAN",
      email: "list-team-tech@example.com",
    });
    const repo = makeTechnicianTeamQueryRepository(fixture.prisma);

    await fixture.factories.userOrgAssignment({
      userId: technician.id,
      technicianTeamId: availableTeam.id,
    });

    const rows = await runEffect(repo.list({
      stationId: stationA.id,
      availabilityStatus: "AVAILABLE",
    }));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe(availableTeam.id);
    expect(rows[0]?.stationId).toBe(stationA.id);
    expect(rows[0]?.stationName).toBe("List Team Station A");
    expect(rows[0]?.memberCount).toBe(1);
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
