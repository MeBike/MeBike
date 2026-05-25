import type { RouteHandler } from "@hono/zod-openapi";

import { Effect } from "effect";

import { ReservationQueryServiceTag } from "@/domain/reservations";
import { createVietnamHourDate, getVietnamForecastWindow } from "@/domain/shared/business-hours";
import { Prisma } from "@/infrastructure/prisma";

type StatsRoutes = typeof import("@mebike/shared")["serverRoutes"]["stats"];

export const getReservationForecast: RouteHandler<StatsRoutes["getReservationForecast"]> = async (c) => {
  const query = c.req.valid("query");
  const stationScopeId = c.var.currentUser!.operatorStationId;

  const window = getVietnamForecastWindow(query.startHour, query.endHour);

  const emptyResponse = {
    windowStart: window.start.toISOString(),
    windowEnd: window.end.toISOString(),
    station: null,
    hours: [],
  };

  if (!stationScopeId)
    return c.json(emptyResponse, 200);

  const program = Effect.gen(function* () {
    const queryService = yield* ReservationQueryServiceTag;
    const prismaService = yield* Prisma;

    const [reservations, station] = yield* Effect.all([
      queryService.getPendingForecastByWindow(window.start, window.end),
      Effect.promise(() => prismaService.client.station.findUnique({
        where: { id: stationScopeId },
        select: { id: true, name: true },
      })),
    ], { concurrency: "unbounded" });

    return { reservations, station };
  });

  const { reservations, station } = await c.var.runPromise(program);
  if (!station)
    return c.json(emptyResponse, 200);

  const reservationCountByHour = new Map<number, number>();
  for (const r of reservations) {
    if (r.station.id === station.id) {
      const hour = r.startTime.getHours();
      reservationCountByHour.set(hour, (reservationCountByHour.get(hour) ?? 0) + 1);
    }
  }

  const hoursList = [];
  for (let h = window.hStart; h < window.hEnd; h++) {
    const slotStart = createVietnamHourDate(window.year, window.month, window.day, h);

    hoursList.push({
      label: `${String(h).padStart(2, "0")}:00`,
      timestamp: slotStart.toISOString(),
      reservedCount: reservationCountByHour.get(h) ?? 0,
    });
  }

  return c.json({
    windowStart: window.start.toISOString(),
    windowEnd: window.end.toISOString(),
    station: { id: station.id, name: station.name },
    hours: hoursList,
  }, 200);
};
