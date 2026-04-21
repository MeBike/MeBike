import ky from "ky";

const METRO_API_BASE_URL = "https://api.metrohcm.ttgt.vn";
const METRO_ROUTE_ID = 384;
const DEFAULT_ERROR_MESSAGE = "Không thể tải dữ liệu Metro lúc này. Vui lòng thử lại sau.";

const metroKy = ky.create({
  prefixUrl: METRO_API_BASE_URL,
  retry: { limit: 0 },
  timeout: 15000,
});

const forwardStationOrder = [7003, 7004, 7005, 7006, 7007, 7008, 7009, 7010, 7011, 7012, 7013, 7016, 7014, 7015] as const;

const metroStationsById: Record<number, { code: string; name: string }> = {
  7003: { code: "BTN", name: "Ga Bến Thành" },
  7004: { code: "OPH", name: "Ga Nhà hát Thành phố" },
  7005: { code: "BSN", name: "Ga Ba Son" },
  7006: { code: "VTP", name: "Ga Văn Thánh" },
  7007: { code: "TCN", name: "Ga Tân Cảng" },
  7008: { code: "TDN", name: "Ga Thảo Điền" },
  7009: { code: "ANP", name: "Ga An Phú" },
  7010: { code: "RCC", name: "Ga Rạch Chiếc" },
  7011: { code: "PCL", name: "Ga Phước Long" },
  7012: { code: "BTT", name: "Ga Bình Thái" },
  7013: { code: "TDC", name: "Ga Thủ Đức" },
  7014: { code: "NUS", name: "Ga Đại học Quốc Gia" },
  7015: { code: "STT", name: "Ga Bến xe Suối Tiên" },
  7016: { code: "HTP", name: "Ga Khu Công nghệ Cao" },
};

const internalStationNameById: Record<number, string> = {
  7003: "Ga Bến Thành",
  7004: "Ga Nhà hát Thành phố",
  7005: "Ga Ba Son",
  7006: "Ga Công viên Văn Thánh",
  7007: "Ga Tân Cảng",
  7008: "Ga Thảo Điền",
  7009: "Ga An Phú",
  7010: "Ga Rạch Chiếc",
  7011: "Ga Phước Long",
  7012: "Ga Bình Thái",
  7013: "Ga Thủ Đức",
  7014: "Ga Đại học Quốc gia",
  7015: "Ga Bến xe Suối Tiên",
  7016: "Ga Khu Công nghệ cao",
};

type MetroVehiclesResponse = {
  vehicles?: Array<{
    angle?: number;
    coordinate?: [number, number];
    percent?: number;
  }>;
};

type MetroRouteInfoResponse = {
  distances?: string[];
};

type MetroScheduledTripsResponse = Record<string, string[]>;

export type MetroDirectionId = 1 | 2;

export type MetroDirectionOption = {
  directionId: MetroDirectionId;
  label: string;
  destination: string;
};

export type MetroVehicle = {
  angle: number;
  coordinate: [number, number];
  percent: number;
};

export type MetroJourneyStation = {
  code: string;
  distanceFromPreviousKm: number | null;
  distanceFromPreviousLabel: string | null;
  internalStationName: string;
  name: string;
  progress: number;
  stopId: number;
  upcomingTimes: string[];
};

export type MetroJourneyData = {
  activeTrainCount: number;
  directionId: MetroDirectionId;
  directionLabel: string;
  lastUpdatedLabel: string;
  stations: MetroJourneyStation[];
  subtitle: string;
  totalDistanceKm: number;
  vehicles: MetroVehicle[];
};

export const metroDirectionOptions: MetroDirectionOption[] = [
  { destination: "Suối Tiên", directionId: 1, label: "Hướng Suối Tiên" },
  { destination: "Bến Thành", directionId: 2, label: "Hướng Bến Thành" },
];

function clampPercent(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getCurrentMetroTimeLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
}

function getOrderedStationIds(directionId: MetroDirectionId) {
  return directionId === 1
    ? [...forwardStationOrder]
    : [...forwardStationOrder].reverse();
}

function parseDistanceKm(value: string) {
  const match = value.match(/[\d.]+/);
  return match ? Number.parseFloat(match[0]) : 0;
}

function resolveUpcomingTimes(times: string[], nowLabel: string) {
  if (times.length === 0) {
    return [];
  }

  const nextIndex = times.findIndex(time => time >= nowLabel);
  const startIndex = nextIndex === -1 ? 0 : nextIndex;
  const upcomingTimes = times.slice(startIndex, startIndex + 3);

  if (upcomingTimes.length === 3) {
    return upcomingTimes;
  }

  return [...upcomingTimes, ...times.slice(0, 3 - upcomingTimes.length)];
}

function buildStations(
  directionId: MetroDirectionId,
  scheduledTrips: MetroScheduledTripsResponse,
  distanceLabels: string[],
) {
  const orderedStationIds = getOrderedStationIds(directionId);
  const distanceValues = distanceLabels.map(parseDistanceKm);
  const totalDistanceKm = distanceValues.reduce((sum, value) => sum + value, 0);
  const nowLabel = getCurrentMetroTimeLabel();
  let accumulatedDistance = 0;

  const stations = orderedStationIds.map((stopId, index) => {
    if (index > 0) {
      accumulatedDistance += distanceValues[index - 1] ?? 0;
    }

    const stationMeta = metroStationsById[stopId];
    const progress = totalDistanceKm > 0
      ? accumulatedDistance / totalDistanceKm
      : (orderedStationIds.length === 1 ? 0 : index / (orderedStationIds.length - 1));

    return {
      code: stationMeta.code,
      distanceFromPreviousKm: index === 0 ? null : distanceValues[index - 1] ?? null,
      distanceFromPreviousLabel: index === 0 ? null : distanceLabels[index - 1] ?? null,
      internalStationName: internalStationNameById[stopId] ?? stationMeta.name,
      name: stationMeta.name,
      progress,
      stopId,
      upcomingTimes: resolveUpcomingTimes(scheduledTrips[String(stopId)] ?? [], nowLabel),
    } satisfies MetroJourneyStation;
  });

  return { stations, totalDistanceKm };
}

function buildVehicles(response: MetroVehiclesResponse): MetroVehicle[] {
  return (response.vehicles ?? [])
    .filter((vehicle) => {
      if (!Array.isArray(vehicle.coordinate) || vehicle.coordinate.length !== 2) {
        return false;
      }

      return typeof vehicle.coordinate[0] === "number"
        && typeof vehicle.coordinate[1] === "number"
        && typeof vehicle.percent === "number"
        && typeof vehicle.angle === "number";
    })
    .map(vehicle => ({
      angle: vehicle.angle ?? 0,
      coordinate: [vehicle.coordinate?.[0] ?? 0, vehicle.coordinate?.[1] ?? 0] as [number, number],
      percent: clampPercent(vehicle.percent ?? 0),
    }))
    .sort((left, right) => right.percent - left.percent);
}

async function fetchMetroJson<T>(path: string, directionId: MetroDirectionId): Promise<T> {
  return metroKy.get(path, {
    searchParams: {
      routeId: String(METRO_ROUTE_ID),
      varId: String(directionId),
    },
  }).json<T>();
}

function buildDirectionLabel(directionId: MetroDirectionId) {
  return metroDirectionOptions.find(option => option.directionId === directionId)?.label
    ?? "Hành trình Metro";
}

export const metroService = {
  async getJourney(directionId: MetroDirectionId): Promise<MetroJourneyData> {
    try {
      const [vehiclesResponse, routeInfoResponse, scheduledTripsResponse] = await Promise.all([
        fetchMetroJson<MetroVehiclesResponse>("transit/vehicles", directionId),
        fetchMetroJson<MetroRouteInfoResponse>("transit/route_info", directionId),
        fetchMetroJson<MetroScheduledTripsResponse>("transit/scheduled_trips", directionId),
      ]);

      const distanceLabels = routeInfoResponse.distances ?? [];
      const { stations, totalDistanceKm } = buildStations(directionId, scheduledTripsResponse, distanceLabels);
      const vehicles = buildVehicles(vehiclesResponse);

      return {
        activeTrainCount: vehicles.length,
        directionId,
        directionLabel: buildDirectionLabel(directionId),
        lastUpdatedLabel: getCurrentMetroTimeLabel(),
        stations,
        subtitle: "Tuyến metro số 1 Bến Thành - Suối Tiên",
        totalDistanceKm,
        vehicles,
      };
    }
    catch {
      throw new Error(DEFAULT_ERROR_MESSAGE);
    }
  },
};
