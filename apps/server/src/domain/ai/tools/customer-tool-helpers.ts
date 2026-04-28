import type { AiChatContext } from "@mebike/shared";

import { Effect, Either, Option } from "effect";
import { z } from "zod";

import type { BikeRow, BikeService } from "@/domain/bikes";
import type { RentalCommandService, RentalService, ReturnSlotRow } from "@/domain/rentals";
import type { ReservationQueryService } from "@/domain/reservations";
import type { StationQueryService } from "@/domain/stations";
import type { WalletService } from "@/domain/wallets/services/wallet.service";

import { returnSlotExpiresAt } from "@/domain/rentals";
import { requiredAvailableBikesForNextReservation, stationCanAcceptReservation } from "@/domain/reservations/services/reservation-availability-rule";
import { toContractNearbyStation, toContractStationReadSummary } from "@/http/presenters/stations.presenter";

export type CreateCustomerToolsArgs = {
  readonly bikeService: BikeService;
  readonly context: AiChatContext | null;
  readonly rentalCommandService: RentalCommandService;
  readonly reservationQueryService: ReservationQueryService;
  readonly rentalService: RentalService;
  readonly stationQueryService: StationQueryService;
  readonly userId: string;
  readonly walletService: WalletService;
};

export type CustomerToolName
  = | "getCurrentRentalSummary"
    | "getCurrentReturnSlot"
    | "createReturnSlot"
    | "switchReturnSlot"
    | "cancelReturnSlot"
    | "getRentalDetail"
    | "getReservationSummary"
    | "getReservationDetail"
    | "getStationDetail"
    | "searchStations"
    | "getNearbyStationsFromLocation"
    | "getNearbyStations"
    | "getStationAvailableBikes"
    | "getBikeDetail"
    | "getWalletSummary"
    | "getWalletTransactionDetail";

export const RentalDetailInputSchema = z.object({
  rentalId: z.string().optional(),
  reference: z.enum(["context", "current", "latest", "id"]).default("context"),
});

export const ReservationDetailInputSchema = z.object({
  reservationId: z.string().optional(),
  reference: z.enum(["context", "latestPendingOrActive", "id"]).default("context"),
});

export const WalletTransactionDetailInputSchema = z.object({
  transactionId: z.string().optional(),
  reference: z.enum(["latest", "id"]).default("latest"),
});

export const StationReferenceSchema = z.enum(["context", "id"]);

export const StationDetailInputSchema = z.object({
  stationId: z.string().optional(),
  reference: StationReferenceSchema.default("context"),
});

export const StationSearchInputSchema = z.object({
  query: z.string().trim().min(1),
  limit: z.number().int().min(1).max(10).default(5),
});

export const NearbyStationsInputSchema = z.object({
  stationId: z.string().optional(),
  reference: StationReferenceSchema.default("context"),
  limit: z.number().int().min(1).max(10).default(5),
  maxDistanceMeters: z.number().int().positive().max(50000).optional(),
});

export const NearbyStationsFromLocationInputSchema = z.object({
  limit: z.number().int().min(1).max(10).default(5),
  maxDistanceMeters: z.number().int().positive().max(50000).optional(),
});

export const StationAvailableBikesInputSchema = z.object({
  stationId: z.string().optional(),
  reference: StationReferenceSchema.default("context"),
  limit: z.number().int().min(1).max(10).default(5),
});

export const BikeDetailInputSchema = z.object({
  bikeId: z.string().optional(),
  reference: z.enum(["context", "id"]).default("context"),
});

export const rentalToolPage = {
  page: 1,
  pageSize: 5,
  sortBy: "updatedAt",
  sortDir: "desc",
} as const;

export const stationToolPage = {
  page: 1,
  pageSize: 5,
  sortBy: "name",
  sortDir: "asc",
} as const;

export const bikeToolPage = {
  page: 1,
  pageSize: 5,
  sortBy: "status",
  sortDir: "asc",
} as const;

const rentalStatusLabels = {
  CANCELLED: "Đã hủy",
  COMPLETED: "Đã hoàn thành",
  OVERDUE_UNRETURNED: "Quá hạn chưa trả",
  RENTED: "Đang hoạt động",
} as const;

const reservationStatusLabels = {
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
  FULFILLED: "Đã hoàn thành",
  PENDING: "Đang chờ xử lý",
} as const;

const bikeStatusLabels = {
  AVAILABLE: "Có sẵn",
  BOOKED: "Đang được thuê",
  BROKEN: "Bị hỏng",
  RESERVED: "Đã đặt trước",
  REDISTRIBUTING: "Đang điều phối",
  LOST: "Xe bị mất",
  DISABLED: "Đã bị vô hiệu hóa",
} as const;

const bikeRentabilityLabels = {
  AVAILABLE: "Sẵn sàng để thuê",
  BOOKED: "Đang được thuê",
  BROKEN: "Không nên sử dụng vì xe đang hỏng",
  NO_STATION: "Không thể thuê vì xe không ở trạm nào",
  RESERVED: "Không sẵn sàng để thuê vì xe đã được đặt trước",
  REDISTRIBUTING: "Không sẵn sàng để thuê vì xe đang được điều phối",
  LOST: "Không nên sử dụng vì xe bị mất",
  DISABLED: "Không sẵn sàng để thuê vì xe đã bị vô hiệu hóa",
} as const;

const returnSlotStatusLabels = {
  ACTIVE: "Đang giữ chỗ",
  CANCELLED: "Đã hủy",
  USED: "Đã sử dụng",
} as const;

export function formatMinorVnd(value: bigint | number | null): string | null {
  if (value === null) {
    return null;
  }

  const numeric = typeof value === "bigint" ? Number(value) : value;
  return `${new Intl.NumberFormat("vi-VN").format(numeric)} VND`;
}

const AI_TIME_ZONE = "Asia/Ho_Chi_Minh";

export function formatLocalDateTime(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: AI_TIME_ZONE,
    year: "numeric",
  });
}

export function toStationAiDetail(station: Parameters<typeof toContractStationReadSummary>[0]) {
  return {
    ...toContractStationReadSummary(station),
    reservationPolicy: {
      canAcceptNewReservation: stationCanAcceptReservation({
        availableBikes: station.availableBikes,
        pendingReservations: station.reservedBikes,
      }),
      requiredAvailableBikes: requiredAvailableBikesForNextReservation(station.reservedBikes),
    },
  };
}

export function toNearbyStationAiDetail(station: Parameters<typeof toContractNearbyStation>[0]) {
  return {
    ...toContractNearbyStation(station),
    reservationPolicy: {
      canAcceptNewReservation: stationCanAcceptReservation({
        availableBikes: station.availableBikes,
        pendingReservations: station.reservedBikes,
      }),
      requiredAvailableBikes: requiredAvailableBikesForNextReservation(station.reservedBikes),
    },
  };
}

export function getRentalStatusLabel(status: keyof typeof rentalStatusLabels) {
  return rentalStatusLabels[status];
}

export function getReservationStatusLabel(status: keyof typeof reservationStatusLabels) {
  return reservationStatusLabels[status];
}

export function getBikeStatusLabel(status: keyof typeof bikeStatusLabels) {
  return bikeStatusLabels[status];
}

export function getReturnSlotStatusLabel(status: keyof typeof returnSlotStatusLabels) {
  return returnSlotStatusLabels[status];
}

export function toReturnSlotAiDetail(
  returnSlot: ReturnSlotRow,
  station: { id: string; name: string; address: string } | null,
) {
  return {
    id: returnSlot.id,
    rentalId: returnSlot.rentalId,
    userId: returnSlot.userId,
    stationId: returnSlot.stationId,
    reservedFrom: returnSlot.reservedFrom.toISOString(),
    expiresAt: returnSlotExpiresAt(returnSlot.reservedFrom).toISOString(),
    reservedFromDisplay: formatLocalDateTime(returnSlot.reservedFrom),
    status: returnSlot.status,
    statusLabel: getReturnSlotStatusLabel(returnSlot.status),
    createdAt: returnSlot.createdAt.toISOString(),
    createdAtDisplay: formatLocalDateTime(returnSlot.createdAt),
    updatedAt: returnSlot.updatedAt.toISOString(),
    updatedAtDisplay: formatLocalDateTime(returnSlot.updatedAt),
    station,
  };
}

function getBikeRentabilityReason(bike: {
  stationId: BikeRow["stationId"];
  status: BikeRow["status"];
}) {
  if (!bike.stationId) {
    return "NO_STATION" as const;
  }

  switch (bike.status) {
    case "AVAILABLE":
      return "AVAILABLE" as const;
    case "BOOKED":
      return "BOOKED" as const;
    case "RESERVED":
      return "RESERVED" as const;
    case "BROKEN":
      return "BROKEN" as const;
    case "REDISTRIBUTING":
      return "REDISTRIBUTING" as const;
    case "LOST":
      return "LOST" as const;
    case "DISABLED":
      return "DISABLED" as const;
  }
}

export function toBikeAiDetail(bike: {
  id: BikeRow["id"];
  bikeNumber: BikeRow["bikeNumber"];
  stationId: BikeRow["stationId"];
  status: BikeRow["status"];
  createdAt: BikeRow["createdAt"];
  updatedAt: BikeRow["updatedAt"];
}) {
  const rentabilityReason = getBikeRentabilityReason(bike);

  return {
    createdAtDisplay: formatLocalDateTime(bike.createdAt),
    id: bike.id,
    bikeNumber: bike.bikeNumber,
    stationId: bike.stationId,
    status: bike.status,
    statusLabel: getBikeStatusLabel(bike.status),
    isRentable: rentabilityReason === "AVAILABLE",
    rentabilityReason,
    rentabilityLabel: bikeRentabilityLabels[rentabilityReason],
    createdAt: bike.createdAt.toISOString(),
    updatedAtDisplay: formatLocalDateTime(bike.updatedAt),
    updatedAt: bike.updatedAt.toISOString(),
  };
}

export async function getStationByIdOrNull(
  stationQueryService: StationQueryService,
  stationId: string,
) {
  const station = await Effect.runPromise(
    stationQueryService.getStationById(stationId).pipe(Effect.either),
  );

  return Either.isRight(station) ? station.right : null;
}

export async function resolveRentalReference(args: {
  context: AiChatContext | null;
  rentalId?: string | null;
  reference: "context" | "current" | "latest" | "id";
  rentalService: RentalService;
  userId: string;
}) {
  let rentalId = args.rentalId ?? null;

  if (!rentalId && args.reference === "context") {
    rentalId = args.context?.rentalId ?? null;
  }

  if (!rentalId && args.reference === "current") {
    const rentals = await Effect.runPromise(
      args.rentalService.listMyCurrentRentals(args.userId, {
        ...rentalToolPage,
        pageSize: 1,
      }),
    );
    rentalId = rentals.items[0]?.id ?? null;
  }

  if (!rentalId && args.reference === "latest") {
    const rentals = await Effect.runPromise(
      args.rentalService.listMyRentals(args.userId, {}, {
        ...rentalToolPage,
        pageSize: 1,
      }),
    );
    rentalId = rentals.items[0]?.id ?? null;
  }

  if (!rentalId) {
    return null;
  }

  const rental = await Effect.runPromise(
    args.rentalService.getMyRentalById(args.userId, rentalId),
  );

  return Option.isSome(rental) ? rental.value : null;
}
