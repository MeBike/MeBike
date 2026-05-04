import type { BikeQueryRepo } from "../../repository/bike.repository";
import type { BikeQueryService } from "./bike-query.service.types";

export function makeBikeQueryService(repo: BikeQueryRepo): BikeQueryService {
  return {
    listBikes: (filter, pageReq) =>
      repo.listByStationWithOffset(filter.stationId, filter, pageReq),

    getBikeDetail: bikeId =>
      repo.getById(bikeId),
  };
}
