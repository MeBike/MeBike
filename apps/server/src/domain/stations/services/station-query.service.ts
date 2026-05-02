import { Effect, Option } from "effect";

import type { StationQueryRepo } from "../repository/station.repository.types";
import type { StationQueryService } from "./station.service.types";

import { StationNotFound } from "../errors";

/**
 * Xây dựng service đọc dữ liệu station cho các query use-case thông thường.
 *
 * Service này cố ý không chứa analytics như revenue aggregation; phần đó nằm
 * trong station stats service riêng.
 */
export function makeStationQueryService(repo: StationQueryRepo): StationQueryService {
  return {
    listStations: (filter, pageReq) =>
      repo.listWithOffset(filter, pageReq),

    getStationById: id =>
      Effect.gen(function* () {
        const maybe = yield* repo.getById(id);
        if (Option.isNone(maybe)) {
          return yield* Effect.fail(new StationNotFound({ id }));
        }

        return maybe.value;
      }),

    listContextExcludingId: excludedId =>
      repo.listContextExcludingId(excludedId),

    listNearestStations: args =>
      repo.listNearest(args),
  };
}
