import { Effect, Option } from "effect";

import type { StationQueryRepo } from "@/domain/stations";

import type { TechnicianTeamCommandRepo, TechnicianTeamQueryRepo } from "../repository/technician-team.repository.types";
import type { TechnicianTeamCommandService } from "./technician-team.service.types";

import {
  TechnicianTeamInternalStationRequired,
  TechnicianTeamNotFound,
  TechnicianTeamStationAlreadyAssigned,
  TechnicianTeamStationNotFound,
} from "../domain-errors";

export function makeTechnicianTeamCommandService(args: {
  commandRepo: TechnicianTeamCommandRepo;
  queryRepo: Pick<TechnicianTeamQueryRepo, "getById" | "list">;
  stationRepo: Pick<StationQueryRepo, "getById">;
}): TechnicianTeamCommandService {
  return {
    createTechnicianTeam: input =>
      Effect.gen(function* () {
        const station = yield* args.stationRepo.getById(input.stationId);
        if (Option.isNone(station)) {
          return yield* Effect.fail(new TechnicianTeamStationNotFound({ stationId: input.stationId }));
        }

        if (station.value.stationType !== "INTERNAL") {
          return yield* Effect.fail(new TechnicianTeamInternalStationRequired({
            stationId: input.stationId,
            stationType: station.value.stationType,
          }));
        }

        const existingTeams = yield* args.queryRepo.list(
          { stationId: input.stationId },
          { page: 1, pageSize: 1 },
        );
        if (existingTeams.items.length > 0) {
          return yield* Effect.fail(new TechnicianTeamStationAlreadyAssigned({
            stationId: input.stationId,
            teamId: existingTeams.items[0]!.id,
          }));
        }

        return yield* args.commandRepo.create({
          ...input,
          availabilityStatus: input.availabilityStatus ?? "AVAILABLE",
        });
      }),

    updateTechnicianTeam: (id, input) =>
      Effect.gen(function* () {
        const current = yield* args.queryRepo.getById(id);
        if (Option.isNone(current)) {
          return yield* Effect.fail(new TechnicianTeamNotFound({ id }));
        }

        return yield* args.commandRepo.update(id, input);
      }),
  };
}
