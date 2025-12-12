import { Effect } from "effect";

import type { PageResult } from "@/domain/shared/pagination";

import type { StationNotFound } from "../errors";
import type {
  ListStationsInput,
  NearestSearchArgs,
  NearestStationRow,
  StationRow,
} from "../repository/station.types";

import { StationServiceTag } from "../services/station.service";

export function listStationsUseCase(
  input: ListStationsInput,
): Effect.Effect<PageResult<StationRow>, never, StationServiceTag> {
  return Effect.gen(function* () {
    const service = yield* StationServiceTag;
    return yield* service.listStations(input.filter, input.pageReq);
  });
}

export function getStationDetailsUseCase(
  id: string,
): Effect.Effect<StationRow, StationNotFound, StationServiceTag> {
  return Effect.gen(function* () {
    const service = yield* StationServiceTag;
    return yield* service.getStationById(id);
  });
}

export function listNearestStationsUseCase(
  args: NearestSearchArgs,
): Effect.Effect<PageResult<NearestStationRow>, never, StationServiceTag> {
  return Effect.gen(function* () {
    const service = yield* StationServiceTag;
    return yield* service.listNearestStations(args);
  });
}
