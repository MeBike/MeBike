import { Effect, Option } from "effect";

import type { StationQueryRepo } from "@/domain/stations";

import type { TechnicianTeamCommandRepo } from "../repository/technician-team.repository.types";
import type { TechnicianTeamCommandService } from "./technician-team.service.types";

import {
  TechnicianTeamInternalStationRequired,
  TechnicianTeamStationNotFound,
} from "../domain-errors";

export function makeTechnicianTeamCommandService(args: {
  commandRepo: TechnicianTeamCommandRepo;
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

        return yield* args.commandRepo.create({
          ...input,
          availabilityStatus: input.availabilityStatus ?? "AVAILABLE",
        });
      }),
  };
}
