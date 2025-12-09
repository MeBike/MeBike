import type {
  BikeRevenueResponse,
  HighestRevenueStation,
  NearestAvailableBike,
  StationAlertsResponse,
  StationRevenueResponse,
  StationStatsResponse,
  StationSummary,
} from "@mebike/shared";

import { OpenAPIHono } from "@hono/zod-openapi";
import {
  serverOpenApi,
  serverRoutes,
} from "@mebike/shared";
import { Scalar } from "@scalar/hono-api-reference";

export function createHttpApp() {
  const app = new OpenAPIHono();
  type StationListResponse = { data: StationSummary[] };

  app.doc("/docs/openapi.json", serverOpenApi);
  app.get(
    "/docs",
    Scalar({
      title: "Server API Reference",
      url: "/docs/openapi.json",
      layout: "modern",
    }),
  );

  const stations = serverRoutes.stations;

  app.openapi(stations.listStations, (c) => {
    return c.json<StationListResponse, 200>({ data: [] }, 200);
  });

  app.openapi(stations.getStation, (c) => {
    const { stationId } = c.req.valid("param");
    return c.json<StationSummary, 200>(
      {
        _id: stationId,
        name: "Example Station",
        address: "123 Main St",
        capacity: 10,
      },
      200 as const,
    );
  });

  app.openapi(stations.getStationStats, (c) => {
    const { stationId } = c.req.valid("param");
    const now = new Date().toISOString();
    const payload: StationStatsResponse = {
      station: {
        _id: stationId,
        name: "Example Station",
        address: "123 Main St",
        capacity: 10,
      },
      period: { from: now, to: now },
      rentals: {
        totalRentals: 0,
        totalRevenue: 0,
        totalDuration: 0,
        avgDuration: 0,
      },
      returns: { totalReturns: 0 },
      currentBikes: {
        totalBikes: 0,
        available: 0,
        booked: 0,
        broken: 0,
        reserved: 0,
        maintained: 0,
        unavailable: 0,
        emptySlots: 0,
      },
      reports: { totalReports: 0, byType: {} },
      utilization: {
        rate: 0,
        availableMinutes: 0,
        usedMinutes: 0,
      },
    };
    return c.json<StationStatsResponse, 200>(payload, 200);
  });

  app.openapi(stations.getAllStationsRevenue, (c) => {
    const now = new Date().toISOString();
    const payload: StationRevenueResponse = {
      period: { from: now, to: now },
      summary: {
        totalStations: 0,
        totalRevenue: 0,
        totalRevenueFormatted: "0",
        totalRentals: 0,
        avgRevenuePerStation: 0,
        avgRevenuePerStationFormatted: "0",
      },
      stations: [],
    };
    return c.json<StationRevenueResponse, 200>(payload, 200);
  });

  app.openapi(stations.getBikeRevenueByStation, (c) => {
    const now = new Date().toISOString();
    const payload: BikeRevenueResponse = {
      period: { from: now, to: now },
      summary: {
        totalStations: 0,
        totalRevenue: 0,
        totalRevenueFormatted: "0",
        totalRentals: 0,
      },
      stations: [],
    };
    return c.json<BikeRevenueResponse, 200>(payload, 200);
  });

  app.openapi(stations.getHighestRevenueStation, (c) => {
    const now = new Date().toISOString();
    const payload: HighestRevenueStation = {
      period: { from: now, to: now },
      station: null,
      message: "No revenue data",
    };
    return c.json<HighestRevenueStation, 200>(payload, 200);
  });

  app.openapi(stations.getNearbyStations, (c) => {
    return c.json<StationListResponse, 200>({ data: [] }, 200);
  });

  app.openapi(stations.getStationAlerts, (c) => {
    const payload: StationAlertsResponse = {
      threshold: 20,
      totalStations: 0,
      alertsCount: { overloaded: 0, underloaded: 0, broken: 0, empty: 0, total: 0 },
      alerts: { overloaded: [], underloaded: [], broken: [], empty: [] },
    };
    return c.json<StationAlertsResponse, 200>(payload, 200);
  });

  app.openapi(stations.getNearestAvailableBike, (c) => {
    const payload: NearestAvailableBike = {
      bike_id: "bike-1",
      chip_id: "chip-1",
      status: "available",
      station_id: "station-1",
      station_name: "Example Station",
      station_address: "123 Main St",
      distance_meters: 100,
      distance_km: 0.1,
    };
    return c.json<NearestAvailableBike, 200>(payload, 200);
  });

  // Register rental routes for docs as well (placeholder handlers)
  const rentals = serverRoutes.rentals;
  Object.values(rentals).forEach((route) => {
    app.openapi(route as any, (c: any) => c.json({ ok: true }, 200));
  });

  return app;
}
