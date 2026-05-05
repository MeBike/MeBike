import { tool } from "ai";
import { Cause, Effect, Exit, Match, Option } from "effect";
import { z } from "zod";

import type {
  CancelReservationFailure,
  ReservationRow,
  ReserveBikeFailure,
} from "@/domain/reservations";

import {
  toContractReservation,
  toContractReservationExpanded,
} from "@/http/presenters/reservations.presenter";

import type { CreateCustomerToolsArgs } from "./customer-tool-helpers";

import {
  formatLocalDateTime,
  formatMinorVnd,
  getReservationStatusLabel,
  getStationByIdOrNull,
  rentalToolPage,
  ReservationDetailInputSchema,
} from "./customer-tool-helpers";
import {
  CancelReservationToolOutputSchema,
  ReservationDetailToolOutputSchema,
  ReservationSummaryToolOutputSchema,
  ReserveBikeToolOutputSchema,
} from "./customer-tool-schemas";

const ReserveBikeInputSchema = z.object({
  bikeId: z.string().uuid(),
  bikeNumber: z.string().trim().min(1).optional().describe("User-facing bike number when already known from prior tool results or explicit user selection. Never put raw ids here."),
  stationName: z.string().trim().min(1).optional().describe("User-facing station name when already known from prior tool results or explicit user selection. Never put raw ids here."),
  startTime: z.string().datetime({ offset: true }).optional().describe("Reservation start time in ISO 8601 format with timezone offset. Use the user-chosen pickup time when they specify one. Omit only when the user clearly wants to reserve immediately."),
});

const CancelReservationInputSchema = z.object({
  reservationId: z.string().uuid().optional(),
  reference: z.enum(["latestPendingOrActive", "id"]).default("latestPendingOrActive"),
  bikeNumber: z.string().trim().min(1).optional().describe("User-facing bike number when already known from prior tool results or explicit user selection. Never put raw ids here."),
  stationName: z.string().trim().min(1).optional().describe("User-facing station name when already known from prior tool results or explicit user selection. Never put raw ids here."),
});

type ReserveBikeToolOutput = z.infer<typeof ReserveBikeToolOutputSchema>;
type ReserveBikeToolFailure = Extract<ReserveBikeToolOutput, { ok: false }>;
type CancelReservationToolOutput = z.infer<typeof CancelReservationToolOutputSchema>;
type CancelReservationToolFailure = Extract<CancelReservationToolOutput, { ok: false }>;

function failReserveBikeAction(
  code: ReserveBikeToolFailure["error"]["code"],
  kind: ReserveBikeToolFailure["error"]["kind"],
  retryable: boolean,
  suggestedAction: ReserveBikeToolFailure["error"]["suggestedAction"],
  userMessage: string,
): ReserveBikeToolFailure {
  return {
    ok: false,
    error: {
      code,
      kind,
      retryable,
      suggestedAction,
      userMessage,
    },
  };
}

function mapReserveBikeFailure(error: ReserveBikeFailure | { readonly _tag: string }): ReserveBikeToolFailure {
  return Match.value(error).pipe(
    Match.tag("OvernightOperationsClosed", () =>
      failReserveBikeAction(
        "OVERNIGHT_OPERATIONS_CLOSED",
        "business",
        false,
        "wait_until_operating_hours",
        "Thời gian giữ chỗ bạn chọn đang nằm ngoài giờ hỗ trợ. Bạn chọn thời gian khác trong giờ hoạt động nhé.",
      )),
    Match.tag("ActiveReservationExists", () =>
      failReserveBikeAction(
        "ACTIVE_RESERVATION_EXISTS",
        "business",
        false,
        "check_current_reservation",
        "Bạn đang có một đặt chỗ còn hiệu lực nên chưa thể giữ thêm xe khác.",
      )),
    Match.tag("BikeAlreadyReserved", () =>
      failReserveBikeAction(
        "BIKE_ALREADY_RESERVED",
        "business",
        true,
        "choose_another_bike",
        "Xe này vừa được người khác giữ chỗ rồi. Bạn chọn xe khác nhé.",
      )),
    Match.tag("BikeNotFound", () =>
      failReserveBikeAction(
        "BIKE_NOT_FOUND",
        "business",
        false,
        "choose_another_bike",
        "Mình không tìm thấy xe này để giữ chỗ.",
      )),
    Match.tag("BikeNotFoundInStation", () =>
      failReserveBikeAction(
        "BIKE_NOT_FOUND_IN_STATION",
        "business",
        false,
        "choose_another_bike",
        "Xe này hiện không còn ở trạm phù hợp để giữ chỗ.",
      )),
    Match.tag("BikeIsRedistributing", () =>
      failReserveBikeAction(
        "BIKE_IS_REDISTRIBUTING",
        "business",
        false,
        "choose_another_bike",
        "Xe này đang được điều phối nên chưa thể giữ chỗ.",
      )),
    Match.tag("BikeIsLost", () =>
      failReserveBikeAction(
        "BIKE_IS_LOST",
        "business",
        false,
        "choose_another_bike",
        "Xe này đang bị đánh dấu mất nên không thể giữ chỗ.",
      )),
    Match.tag("BikeIsDisabled", () =>
      failReserveBikeAction(
        "BIKE_IS_DISABLED",
        "business",
        false,
        "choose_another_bike",
        "Xe này đang bị vô hiệu hóa nên không thể giữ chỗ.",
      )),
    Match.tag("BikeNotAvailable", () =>
      failReserveBikeAction(
        "BIKE_NOT_AVAILABLE",
        "business",
        false,
        "choose_another_bike",
        "Xe này hiện chưa sẵn sàng để giữ chỗ. Bạn chọn xe khác nhé.",
      )),
    Match.tag("StationReservationAvailabilityTooLow", () =>
      failReserveBikeAction(
        "STATION_RESERVATION_AVAILABILITY_TOO_LOW",
        "business",
        true,
        "choose_another_bike",
        "Trạm này hiện không đủ lượng xe trống để tạo thêm giữ chỗ mới.",
      )),
    Match.tag("WalletNotFound", () =>
      failReserveBikeAction(
        "WALLET_NOT_FOUND",
        "business",
        false,
        "top_up_wallet",
        "Mình chưa tìm thấy ví để thanh toán phí giữ chỗ này.",
      )),
    Match.tag("InsufficientWalletBalance", () =>
      failReserveBikeAction(
        "INSUFFICIENT_WALLET_BALANCE",
        "business",
        false,
        "top_up_wallet",
        "Số dư ví hiện chưa đủ để giữ chỗ xe này.",
      )),
    Match.orElse(() =>
      failReserveBikeAction(
        "TEMPORARY_UNAVAILABLE",
        "temporary",
        true,
        "retry_later",
        "Hiện chưa thể giữ chỗ xe do lỗi tạm thời của hệ thống. Bạn thử lại sau ít phút nhé.",
      )),
  );
}

function failCancelReservationAction(
  code: CancelReservationToolFailure["error"]["code"],
  kind: CancelReservationToolFailure["error"]["kind"],
  retryable: boolean,
  suggestedAction: CancelReservationToolFailure["error"]["suggestedAction"],
  userMessage: string,
): CancelReservationToolFailure {
  return {
    ok: false,
    error: {
      code,
      kind,
      retryable,
      suggestedAction,
      userMessage,
    },
  };
}

function mapCancelReservationFailure(
  error: CancelReservationFailure,
): CancelReservationToolFailure {
  return Match.value(error).pipe(
    Match.tag("ReservationNotFound", () =>
      failCancelReservationAction(
        "RESERVATION_NOT_FOUND",
        "business",
        false,
        "check_current_reservation",
        "Mình không tìm thấy đặt chỗ này để hủy.",
      )),
    Match.tag("ReservationNotOwned", () =>
      failCancelReservationAction(
        "RESERVATION_NOT_FOUND",
        "business",
        false,
        "check_current_reservation",
        "Mình không tìm thấy đặt chỗ này để hủy.",
      )),
    Match.tag("InvalidReservationTransition", reservationError =>
      failCancelReservationAction(
        "RESERVATION_CANNOT_BE_CANCELLED",
        "business",
        false,
        "check_current_reservation",
        reservationError.from === "CANCELLED"
          ? "Đặt chỗ này đã được hủy trước đó rồi."
          : reservationError.from === "FULFILLED"
            ? "Đặt chỗ này đã được xác nhận hoặc hoàn tất nên không thể hủy nữa."
            : reservationError.from === "EXPIRED"
              ? "Đặt chỗ này đã hết hạn nên không thể hủy nữa."
              : "Đặt chỗ này hiện không còn ở trạng thái có thể hủy.",
      )),
    Match.orElse(() =>
      failCancelReservationAction(
        "TEMPORARY_UNAVAILABLE",
        "temporary",
        true,
        "retry_later",
        "Hiện chưa thể hủy giữ chỗ xe do lỗi tạm thời của hệ thống. Bạn thử lại sau ít phút nhé.",
      )),
  );
}

async function toReservationActionSuccess(
  args: CreateCustomerToolsArgs,
  reservation: ReservationRow,
) {
  const station = await getStationByIdOrNull(
    args.stationQueryService,
    reservation.stationId,
  );

  return {
    bikeNumber: reservation.bikeNumber,
    createdAtDisplay: formatLocalDateTime(reservation.createdAt),
    endTimeDisplay: formatLocalDateTime(reservation.endTime),
    prepaidDisplay: formatMinorVnd(Number(reservation.prepaid.toString())),
    reservation: toContractReservation(reservation),
    startTimeDisplay: formatLocalDateTime(reservation.startTime),
    station: station
      ? {
          id: station.id,
          name: station.name,
          address: station.address,
        }
      : null,
    statusLabel: getReservationStatusLabel(reservation.status),
    updatedAtDisplay: formatLocalDateTime(reservation.updatedAt),
  };
}

export function createCustomerReservationTools(args: CreateCustomerToolsArgs) {
  return {
    getReservationSummary: tool({
      description: "Get the current user's latest active or pending reservation plus recent reservation history.",
      inputSchema: z.object({}),
      outputSchema: ReservationSummaryToolOutputSchema,
      execute: async (): Promise<z.infer<typeof ReservationSummaryToolOutputSchema>> => {
        const [latestPendingOrActive, reservations] = await Promise.all([
          Effect.runPromise(
            args.reservationQueryService.getLatestPendingOrActiveForUser(args.userId),
          ),
          Effect.runPromise(
            args.reservationQueryService.listForUser(
              args.userId,
              {},
              rentalToolPage,
            ),
          ),
        ]);

        return {
          latestPendingOrActive: Option.isSome(latestPendingOrActive)
            ? {
                ...toContractReservation(latestPendingOrActive.value),
                createdAtDisplay: formatLocalDateTime(latestPendingOrActive.value.createdAt),
                endTimeDisplay: formatLocalDateTime(latestPendingOrActive.value.endTime),
                prepaidDisplay: formatMinorVnd(Number(latestPendingOrActive.value.prepaid.toString())),
                startTimeDisplay: formatLocalDateTime(latestPendingOrActive.value.startTime),
                statusLabel: getReservationStatusLabel(latestPendingOrActive.value.status),
                updatedAtDisplay: formatLocalDateTime(latestPendingOrActive.value.updatedAt),
              }
            : null,
          reservations: reservations.items.map(reservation => ({
            ...toContractReservation(reservation),
            createdAtDisplay: formatLocalDateTime(reservation.createdAt),
            endTimeDisplay: formatLocalDateTime(reservation.endTime),
            prepaidDisplay: formatMinorVnd(Number(reservation.prepaid.toString())),
            startTimeDisplay: formatLocalDateTime(reservation.startTime),
            statusLabel: getReservationStatusLabel(reservation.status),
            updatedAtDisplay: formatLocalDateTime(reservation.updatedAt),
          })),
        };
      },
    }),
    getReservationDetail: tool({
      description: "Get one user-owned reservation detail. Prefer the latest pending or active reservation or an id already returned by another tool before raw ids.",
      inputSchema: ReservationDetailInputSchema,
      outputSchema: ReservationDetailToolOutputSchema,
      execute: async (input): Promise<z.infer<typeof ReservationDetailToolOutputSchema>> => {
        let reservationId = input.reservationId ?? null;

        if (!reservationId && input.reference === "latestPendingOrActive") {
          const latest = await Effect.runPromise(
            args.reservationQueryService.getLatestPendingOrActiveForUser(args.userId),
          );
          reservationId = Option.isSome(latest) ? latest.value.id : null;
        }

        if (!reservationId) {
          return { reference: input.reference, detail: null };
        }

        const detail = await Effect.runPromise(
          args.reservationQueryService.getExpandedDetailById(reservationId),
        );

        return {
          reference: input.reference,
          detail: Option.isSome(detail) && detail.value.user.id === args.userId
            ? {
                ...toContractReservationExpanded(detail.value),
                createdAtDisplay: formatLocalDateTime(detail.value.createdAt),
                endTimeDisplay: formatLocalDateTime(detail.value.endTime),
                prepaidDisplay: formatMinorVnd(Number(detail.value.prepaid.toString())),
                startTimeDisplay: formatLocalDateTime(detail.value.startTime),
                statusLabel: getReservationStatusLabel(detail.value.status),
                updatedAtDisplay: formatLocalDateTime(detail.value.updatedAt),
              }
            : null,
        };
      },
    }),
    cancelReservation: tool({
      description: "Cancel the current user's pending reservation. Prefer the latest pending or active reservation unless an exact reservation id is already known from prior tool results.",
      inputSchema: CancelReservationInputSchema,
      outputSchema: CancelReservationToolOutputSchema,
      needsApproval: true,
      execute: async (input): Promise<CancelReservationToolOutput> => {
        let reservationId = input.reservationId ?? null;

        if (!reservationId && input.reference === "latestPendingOrActive") {
          const latest = await Effect.runPromise(
            args.reservationQueryService.getLatestPendingOrActiveForUser(args.userId),
          );
          reservationId = Option.isSome(latest) ? latest.value.id : null;
        }

        if (!reservationId) {
          return failCancelReservationAction(
            "NO_CANCELLABLE_RESERVATION",
            "business",
            false,
            "check_current_reservation",
            "Bạn hiện không có đặt chỗ nào còn hiệu lực để hủy.",
          );
        }

        const exit = await Effect.runPromiseExit(
          args.reservationCommandService.cancelReservation({
            reservationId,
            userId: args.userId,
          }).pipe(
            Effect.mapError(error => mapCancelReservationFailure(error)),
          ),
        );

        if (Exit.isSuccess(exit)) {
          return {
            ok: true,
            reservation: await toReservationActionSuccess(args, exit.value),
          };
        }

        if (Cause.isFailType(exit.cause)) {
          return exit.cause.error;
        }

        throw new Error("Không thể hủy giữ chỗ xe do lỗi hệ thống ngoài dự kiến.");
      },
    }),
    reserveBike: tool({
      description: "Reserve one exact bike for pickup at a specific time. Use this only when the user clearly asks to reserve that exact bike, with either an immediate start or a chosen future start time.",
      inputSchema: ReserveBikeInputSchema,
      outputSchema: ReserveBikeToolOutputSchema,
      needsApproval: true,
      execute: async (input): Promise<ReserveBikeToolOutput> => {
        const startTime = input.startTime ? new Date(input.startTime) : new Date();

        const exit = await Effect.runPromiseExit(Effect.gen(function* () {
          const bike = yield* args.bikeQueryService.getBikeDetail(input.bikeId);

          if (Option.isNone(bike)) {
            return yield* Effect.fail(mapReserveBikeFailure({ _tag: "BikeNotFound" }));
          }

          const stationId = bike.value.stationId ?? null;

          if (!stationId) {
            return yield* Effect.fail(mapReserveBikeFailure({ _tag: "BikeNotAvailable" }));
          }

          const createdReservation = yield* args.reservationCommandService.reserveBike({
            userId: args.userId,
            bikeId: input.bikeId,
            stationId,
            reservationOption: "ONE_TIME",
            startTime,
            endTime: null,
          }).pipe(
            Effect.mapError(error => mapReserveBikeFailure(error)),
          );

          return {
            bikeNumber: bike.value.bikeNumber,
            reservation: createdReservation,
          } as const;
        }));

        if (Exit.isSuccess(exit)) {
          return {
            ok: true,
            reservation: {
              ...(await toReservationActionSuccess(args, exit.value.reservation)),
              bikeNumber: exit.value.reservation.bikeNumber ?? exit.value.bikeNumber,
            },
          };
        }

        if (Cause.isFailType(exit.cause)) {
          return exit.cause.error;
        }

        throw new Error("Không thể giữ chỗ xe do lỗi hệ thống ngoài dự kiến.");
      },
    }),
  } as const;
}
