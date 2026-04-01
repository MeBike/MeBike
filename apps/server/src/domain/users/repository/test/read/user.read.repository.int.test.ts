import { Option } from "effect";
import { uuidv7 } from "uuidv7";
import { beforeAll, describe, expect, it } from "vitest";

import { UserRepositoryError } from "@/domain/users/domain-errors";
import { makeUnreachablePrisma } from "@/test/db/unreachable-prisma";
import { expectDefect } from "@/test/effect/assertions";
import { runEffect } from "@/test/effect/run";

import {
  createUserInput,
  setupUserRepositoryIntTestKit,
} from "../user.repository.int.test-kit";

describe("userReadRepository Integration", () => {
  const kit = setupUserRepositoryIntTestKit();
  let repo: ReturnType<typeof kit.makeRepo>;

  beforeAll(() => {
    repo = kit.makeRepo();
  });

  it("findById and findByEmail return the user", async () => {
    const created = await runEffect(repo.createUser(createUserInput()));

    const byId = await runEffect(repo.findById(created.id));
    expect(Option.isSome(byId)).toBe(true);
    if (Option.isSome(byId)) {
      expect(byId.value.email).toBe(created.email);
    }

    const byEmail = await runEffect(repo.findByEmail(created.email));
    expect(Option.isSome(byEmail)).toBe(true);
    if (Option.isSome(byEmail)) {
      expect(byEmail.value.id).toBe(created.id);
    }
  });

  it("findById returns Option.none for missing user", async () => {
    const result = await runEffect(repo.findById(uuidv7()));
    expect(Option.isNone(result)).toBe(true);
  });

  it("listWithOffset filters by multiple roles", async () => {
    const staff = await runEffect(repo.createUser(createUserInput({ role: "STAFF" })));
    const technician = await runEffect(repo.createUser(createUserInput({ role: "TECHNICIAN" })));
    const agency = await runEffect(repo.createUser(createUserInput({ role: "AGENCY" })));
    const user = await runEffect(repo.createUser(createUserInput({ role: "USER" })));

    const page = await runEffect(repo.listWithOffset(
      { roles: ["STAFF", "TECHNICIAN", "AGENCY"] },
      { page: 1, pageSize: 20 },
    ));

    const ids = page.items.map(item => item.id);
    expect(ids).toContain(staff.id);
    expect(ids).toContain(technician.id);
    expect(ids).toContain(agency.id);
    expect(ids).not.toContain(user.id);
  });

  it("searchByQuery matches user email and phone number", async () => {
    const user = await runEffect(repo.createUser(createUserInput({
      email: "search-user@example.com",
      phoneNumber: "0911222333",
    })));

    const byEmail = await runEffect(repo.searchByQuery("search-user"));
    expect(byEmail.some(item => item.id === user.id)).toBe(true);

    const byPhone = await runEffect(repo.searchByQuery("0911222"));
    expect(byPhone.some(item => item.id === user.id)).toBe(true);
  });

  it("listTechnicianSummaries returns technicians only", async () => {
    const technician = await runEffect(repo.createUser(createUserInput({
      fullname: "Alpha Technician",
      email: "alpha-tech@example.com",
      role: "TECHNICIAN",
    })));
    await runEffect(repo.createUser(createUserInput({
      fullname: "Regular User",
      email: "regular-user@example.com",
      role: "USER",
    })));

    const result = await runEffect(repo.listTechnicianSummaries());

    expect(result.some(item => item.id === technician.id && item.fullname === "Alpha Technician")).toBe(true);
    expect(result.some(item => item.fullname === "Regular User")).toBe(false);
  });

  it("countTechnicianTeamMembers counts members and supports exclusion", async () => {
    const station = await kit.fixture.factories.station({ name: "Read Team Station" });
    const team = await kit.fixture.factories.technicianTeam({
      name: "Read Team",
      stationId: station.id,
    });
    const first = await kit.fixture.factories.user({ role: "TECHNICIAN", email: "read-team-1@example.com" });
    const second = await kit.fixture.factories.user({ role: "TECHNICIAN", email: "read-team-2@example.com" });

    await kit.fixture.factories.userOrgAssignment({
      userId: first.id,
      technicianTeamId: team.id,
    });
    await kit.fixture.factories.userOrgAssignment({
      userId: second.id,
      technicianTeamId: team.id,
    });

    const count = await runEffect(repo.countTechnicianTeamMembers(team.id));
    const excludedCount = await runEffect(repo.countTechnicianTeamMembers(team.id, {
      excludeUserId: first.id,
    }));

    expect(count).toBe(2);
    expect(excludedCount).toBe(1);
  });

  it("listAvailableTechnicianTeams omits full teams and supports station filter", async () => {
    const stationA = await kit.fixture.factories.station({ name: "Team Station A" });
    const stationB = await kit.fixture.factories.station({ name: "Team Station B" });
    const availableTeam = await kit.fixture.factories.technicianTeam({
      name: "Available Team",
      stationId: stationA.id,
    });
    const fullTeam = await kit.fixture.factories.technicianTeam({
      name: "Full Team",
      stationId: stationA.id,
    });
    await kit.fixture.factories.technicianTeam({
      name: "Unavailable Team",
      stationId: stationA.id,
      availabilityStatus: "UNAVAILABLE",
    });
    const otherStationTeam = await kit.fixture.factories.technicianTeam({
      name: "Other Station Team",
      stationId: stationB.id,
    });

    for (let i = 0; i < 3; i++) {
      const user = await kit.fixture.factories.user({
        role: "TECHNICIAN",
        email: `full-team-${i}@example.com`,
      });
      await kit.fixture.factories.userOrgAssignment({
        userId: user.id,
        technicianTeamId: fullTeam.id,
      });
    }

    const allTeams = await runEffect(repo.listAvailableTechnicianTeams());
    expect(allTeams.map(item => item.id)).toContain(availableTeam.id);
    expect(allTeams.map(item => item.id)).toContain(otherStationTeam.id);
    expect(allTeams.map(item => item.id)).not.toContain(fullTeam.id);

    const filteredTeams = await runEffect(repo.listAvailableTechnicianTeams({
      stationId: stationA.id,
    }));
    expect(filteredTeams.map(item => item.id)).toContain(availableTeam.id);
    expect(filteredTeams.map(item => item.id)).not.toContain(otherStationTeam.id);
    expect(filteredTeams.map(item => item.id)).not.toContain(fullTeam.id);
  });

  it("defects with UserRepositoryError when database is unreachable", async () => {
    const broken = makeUnreachablePrisma();
    try {
      const brokenRepo = kit.makeRepo(broken.client);

      await expectDefect(
        brokenRepo.findById(uuidv7()),
        UserRepositoryError,
        { operation: "findById" },
      );
    }
    finally {
      await broken.stop();
    }
  });

  it("findById works inside a transaction-bound repository", async () => {
    const user = await runEffect(repo.createUser(createUserInput()));

    const result = await kit.fixture.prisma.$transaction(async (tx) => {
      const txRepo = kit.makeRepo(tx);
      return runEffect(txRepo.findById(user.id));
    });

    expect(Option.isSome(result)).toBe(true);
  });
});
