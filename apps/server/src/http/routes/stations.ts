import { serverRoutes } from "@mebike/shared";

import { StationPublicController } from "@/http/controllers/stations";

export function registerStationRoutes(
  app: import("@hono/zod-openapi").OpenAPIHono,
) {
  const stations = serverRoutes.stations;

  app.openapi(stations.listStations, StationPublicController.listStations);

  app.openapi(stations.getNearbyStations, StationPublicController.getNearbyStations);

  app.openapi(stations.getStation, StationPublicController.getStation);
}
