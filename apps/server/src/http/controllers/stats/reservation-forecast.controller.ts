import type { RouteHandler } from "@hono/zod-openapi";
import { Effect } from "effect";

import { ReservationQueryServiceTag } from "@/domain/reservations";
import { VIETNAM_TIME_ZONE } from "@/domain/shared/business-hours";
import { Prisma } from "@/infrastructure/prisma";

type StatsRoutes = typeof import("@mebike/shared")["serverRoutes"]["stats"];

export const getReservationForecast: RouteHandler<StatsRoutes["getReservationForecast"]> = async (c) => {
  const query = c.req.valid("query");
  const { startHour, endHour } = query;

  let start: Date;
  let end: Date;

  if (startHour !== undefined && endHour !== undefined) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: VIETNAM_TIME_ZONE,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const parts = formatter.formatToParts(new Date());
    const getVal = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);
    const year = getVal("year");
    const month = getVal("month");
    const day = getVal("day");

    start = createVietnamHourDate(year, month, day, startHour);
    end = createVietnamHourDate(year, month, day, endHour);
  } else {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: VIETNAM_TIME_ZONE,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const getVal = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);

    const year = getVal("year");
    const month = getVal("month");
    const day = getVal("day");
    const hour = getVal("hour") % 24;
    const minute = getVal("minute");

    let hStart = hour;
    if (minute >= 50) {
      hStart = hour + 1;
    }

    if (hStart < 5) {
      hStart = 5;
    } else if (hStart > 23) {
      hStart = 23;
    }

    start = createVietnamHourDate(year, month, day, hStart);
    end = createVietnamHourDate(year, month, day, hStart + 1);
  }

  const stationScopeId = c.var.currentUser!.operatorStationId

  if (stationScopeId === null) {
    return c.json({
      windowStart: start.toISOString(),
      windowEnd: end.toISOString(),
      station: null,
    }, 200);
  }

  const eff = Effect.gen(function* () {
    const queryService = yield* ReservationQueryServiceTag;
    const prismaService = yield* Prisma;
    const reservations = yield* queryService.getPendingForecastByWindow(start, end);
    return { prisma: prismaService.client, reservations };
  });

  const { prisma, reservations } = await c.var.runPromise(eff);

  const [station, bikes] = await Promise.all([
    prisma.station.findUnique({
      where: { id: stationScopeId },
      select: {
        id: true,
        name: true,
        totalCapacity: true,
      },
    }),
    prisma.bike.findMany({
      where: {
        stationId: stationScopeId,
      },
      select: {
        stationId: true,
        status: true,
      },
    }),
  ]);

  if (!station) {
    return c.json({
      windowStart: start.toISOString(),
      windowEnd: end.toISOString(),
      station: null,
    }, 200);
  }

  const counts = { AVAILABLE: 0, RESERVED: 0, PENDING_DISPATCH: 0, BROKEN: 0, FIXED: 0 };
  for (const b of bikes) {
    if (b.status === "AVAILABLE") counts.AVAILABLE++;
    else if (b.status === "RESERVED") counts.RESERVED++;
    else if (b.status === "PENDING_DISPATCH") counts.PENDING_DISPATCH++;
    else if (b.status === "BROKEN") counts.BROKEN++;
    else if (b.status === "FIXED") counts.FIXED++;
  }

  const currentBikes = Math.min(
    station.totalCapacity,
    counts.AVAILABLE + counts.RESERVED + counts.PENDING_DISPATCH + counts.BROKEN + counts.FIXED
  );

  let reservedCount = 0;
  for (const r of reservations) {
    if (r.station.id === station.id) {
      reservedCount++;
    }
  }

  const expectedBikes = currentBikes - reservedCount;

  const stationForecast = {
    id: station.id,
    name: station.name,
    currentBikes,
    reservedCount,
    expectedBikes,
  };

  return c.json({
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
    station: stationForecast,
  }, 200);
};

function createVietnamHourDate(year: number, month: number, day: number, hour: number): Date {
  return new Date(Date.UTC(year, month - 1, day, hour - 7, 0, 0, 0));
}
