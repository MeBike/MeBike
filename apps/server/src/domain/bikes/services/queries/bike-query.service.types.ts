import type { Effect, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import type { BikeFilter, BikeRow, BikeSortField } from "../../models";

export type BikeQueryService = {
  listBikes: (
    filter: BikeFilter,
    pageReq: PageRequest<BikeSortField>,
  ) => Effect.Effect<PageResult<BikeRow>>;

  getBikeDetail: (bikeId: string) => Effect.Effect<Option.Option<BikeRow>>;
};
