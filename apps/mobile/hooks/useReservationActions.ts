import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Alert } from "react-native";

import type { Reservation } from "../types/reservation-types";
import type { ReservationOption } from "@services/reservation.service";

import { useCancelReservationMutation } from "./mutations/Reservation/useCancelReservationMutation";
import { useConfirmReservationMutation } from "./mutations/Reservation/useConfirmReservationMutation";
import { useCreateReservationMutation } from "./mutations/Reservation/useCreateReservationMutation";
import { useGetPendingReservationsQuery } from "./query/Reservation/useGetPendingReservationsQuery";
import { useGetReservationDetailQuery } from "./query/Reservation/useGetReservationDetailQuery";
import { useGetReservationHistoryQuery } from "./query/Reservation/useGetReservationHistoryQuery";

type ErrorResponse = {
  response?: {
    data?: {
      errors?: Record<string, { msg?: string }>;
      message?: string;
    };
  };
};

type ErrorWithMessage = {
  message: string;
};

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as ErrorResponse;
  if (axiosError?.response?.data) {
    const { errors, message } = axiosError.response.data;
    if (errors) {
      const firstError = Object.values(errors)[0];
      if (firstError?.msg)
        return firstError.msg;
    }
    if (message)
      return message;
  }

  const simpleError = error as ErrorWithMessage;
  if (simpleError?.message) {
    return simpleError.message;
  }

  return fallback;
}

type UseReservationActionsParams = {
  hasToken: boolean;
  pendingPage?: number;
  pendingLimit?: number;
  historyPage?: number;
  historyLimit?: number;
  reservationId?: string;
  enableDetailQuery?: boolean;
  autoFetch?: boolean;
};

type RawReservation = Omit<Reservation, "prepaid"> & {
  prepaid?: number | string | { $numberDecimal?: string };
  station?: Reservation["station"];
};

function normalizePrepaid(value: RawReservation["prepaid"]): number {
  if (typeof value === "number")
    return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === "object" && "$numberDecimal" in value) {
    const parsed = Number(value.$numberDecimal);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeReservation(reservation: RawReservation): Reservation {
  return {
    ...reservation,
    prepaid: normalizePrepaid(reservation.prepaid),
  };
}

export function useReservationActions({
  hasToken,
  pendingPage = 1,
  pendingLimit = 10,
  historyPage = 1,
  historyLimit = 10,
  reservationId,
  enableDetailQuery = false,
  autoFetch = true,
}: UseReservationActionsParams) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const SERVER_TIME_OFFSET_MS = 7 * 60 * 60 * 1000;
  const RESERVATION_BUFFER_MS = 2 * 60 * 1000;

  type MutationCallbacks = {
    onSuccess?: () => void;
    onError?: (message: string) => void;
  };

  const shouldFetchLists = autoFetch && hasToken;

  const {
    refetch: refetchPendingReservations,
    data: pendingReservationsResponse,
    isLoading: isPendingReservationsLoading,
    isFetching: isPendingReservationsFetching,
  } = useGetPendingReservationsQuery(pendingPage, pendingLimit, shouldFetchLists);
  const {
    refetch: refetchReservationHistory,
    data: reservationHistoryResponse,
    isLoading: isReservationHistoryLoading,
    isFetching: isReservationHistoryFetching,
  } = useGetReservationHistoryQuery(historyPage, historyLimit, shouldFetchLists);
  const {
    refetch: refetchReservationDetail,
    data: reservationDetailResponse,
    isLoading: isReservationDetailLoading,
    isFetching: isReservationDetailFetching,
  } = useGetReservationDetailQuery(reservationId ?? "", enableDetailQuery);

  const createReservationMutation = useCreateReservationMutation();
  const cancelReservationMutation = useCancelReservationMutation();
  const confirmReservationMutation = useConfirmReservationMutation();

  const ensureAuthenticated = useCallback(() => {
    if (!hasToken) {
      navigation.navigate("Login" as never);
      return false;
    }
    return true;
  }, [hasToken, navigation]);

  const fetchPendingReservations = useCallback(async () => {
    if (!ensureAuthenticated())
      return;
    await refetchPendingReservations();
  }, [ensureAuthenticated, refetchPendingReservations]);

  const fetchReservationHistory = useCallback(async () => {
    if (!ensureAuthenticated())
      return;
    await refetchReservationHistory();
  }, [ensureAuthenticated, refetchReservationHistory]);

  const fetchReservationDetail = useCallback(async () => {
    if (!ensureAuthenticated() || !reservationId)
      return;
    await refetchReservationDetail();
  }, [ensureAuthenticated, refetchReservationDetail, reservationId]);

type CreateReservationOptions = {
  reservationOption?: ReservationOption;
  subscriptionId?: string;
  callbacks?: MutationCallbacks;
};

  const createReservation = useCallback(
    (bikeId: string, startTime?: string, options?: CreateReservationOptions) => {
      if (!ensureAuthenticated())
        return;
      const startISO = startTime
        ? new Date(new Date(startTime).getTime() + SERVER_TIME_OFFSET_MS).toISOString()
        : new Date(Date.now() + SERVER_TIME_OFFSET_MS + RESERVATION_BUFFER_MS).toISOString();
      const reservationOption = options?.reservationOption ?? "MỘT LẦN";
      const payload = {
        bike_id: bikeId,
        start_time: startISO,
        reservation_option: reservationOption,
        ...(reservationOption === "GÓI THÁNG" && options?.subscriptionId
          ? { subscription_id: options.subscriptionId }
          : {}),
      };

      console.log("[Reservation] Creating reservation", payload);

      createReservationMutation.mutate(payload, {
        onSuccess: () => {
          Alert.alert("Thành công", "Đặt xe thành công.");
          queryClient.invalidateQueries({ queryKey: ["reservations"] });
          queryClient.invalidateQueries({ queryKey: ["reservations", "history"] });
          queryClient.invalidateQueries({ queryKey: ["rentals", "all", 1, 10] });
          queryClient.invalidateQueries({ queryKey: ["rentals"] });
          queryClient.invalidateQueries({ queryKey: ["all-stations"] });
          queryClient.invalidateQueries({ queryKey: ["station"] });
          queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
          options?.callbacks?.onSuccess?.();
        },
        onError: (error) => {
          const message = getErrorMessage(
            error,
            "Không thể đặt xe, vui lòng thử lại sau.",
          );
          
          // Check if error is due to insufficient balance
          const isInsufficientBalance = message.includes("không đủ") || message.includes("insufficient");
          
          if (isInsufficientBalance) {
            Alert.alert(
              "Không đủ tiền",
              message,
              [
                {
                  text: "Hủy",
                  onPress: () => {},
                  style: "cancel",
                },
                {
                  text: "Nạp tiền ngay",
                  onPress: () => {
                    navigation.navigate("MyWallet" as never);
                  },
                },
              ]
            );
          } else {
            Alert.alert("Lỗi đặt xe", message);
          }
          
          options?.callbacks?.onError?.(message);
        },
      });
    },
    [createReservationMutation, ensureAuthenticated, queryClient, navigation],
  );

  const cancelReservation = useCallback(
    (
      id: string,
      reason: string = "Huỷ đặt trước trên ứng dụng",
      callbacks?: MutationCallbacks,
    ) => {
      if (!ensureAuthenticated())
        return;
      cancelReservationMutation.mutate(
        { id, payload: { reason } },
        {
          onSuccess: () => {
            Alert.alert("Thành công", "Huỷ đặt trước thành công.");
            queryClient.invalidateQueries({ queryKey: ["reservations"] });
            queryClient.invalidateQueries({ queryKey: ["reservations", "history"] });
            queryClient.invalidateQueries({ queryKey: ["rentals", "all", 1, 10] });
            queryClient.invalidateQueries({ queryKey: ["rentals"] });
            queryClient.invalidateQueries({ queryKey: ["all-stations"] });
            queryClient.invalidateQueries({ queryKey: ["station"] });
            callbacks?.onSuccess?.();
          },
          onError: (error) => {
            const message = getErrorMessage(
              error,
              "Không thể huỷ đặt trước, vui lòng thử lại.",
            );
            Alert.alert("Lỗi huỷ đặt trước", message);
            callbacks?.onError?.(message);
          },
        },
      );
    },
    [cancelReservationMutation, ensureAuthenticated, queryClient],
  );

  const confirmReservation = useCallback(
    (id: string, callbacks?: MutationCallbacks) => {
      if (!ensureAuthenticated())
        return;
      confirmReservationMutation.mutate(id, {
        onSuccess: () => {
          Alert.alert("Thành công", "Bắt đầu hành trình của bạn ngay thôi!");
          queryClient.invalidateQueries({ queryKey: ["reservations"] });
          queryClient.invalidateQueries({ queryKey: ["reservations", "history"] });
          queryClient.invalidateQueries({ queryKey: ["rentals", "all", 1, 10] });
          queryClient.invalidateQueries({ queryKey: ["rentals"] });
          queryClient.invalidateQueries({ queryKey: ["all-stations"] });
          queryClient.invalidateQueries({ queryKey: ["station"] });
          callbacks?.onSuccess?.();
        },
        onError: (error) => {
          const message = getErrorMessage(
            error,
            "Không thể xác nhận đặt trước, vui lòng thử lại.",
          );
          Alert.alert("Lỗi xác nhận", message);
          callbacks?.onError?.(message);
        },
      });
    },
    [confirmReservationMutation, ensureAuthenticated, queryClient],
  );

  const pendingResponse = pendingReservationsResponse?.data;
  const historyResponse = reservationHistoryResponse?.data;
  const detailResponse = reservationDetailResponse
    ? normalizeReservation(reservationDetailResponse as RawReservation)
    : undefined;

  const normalizedPending = Array.isArray(pendingResponse?.data)
    ? (pendingResponse!.data as RawReservation[]).map(normalizeReservation)
    : [];
  const normalizedHistory = Array.isArray(historyResponse?.data)
    ? (historyResponse!.data as RawReservation[]).map(normalizeReservation)
    : [];

  return {
    // Queries
    fetchPendingReservations,
    fetchReservationHistory,
    fetchReservationDetail,
    pendingReservations: normalizedPending,
    pendingPagination: pendingResponse?.pagination,
    reservationHistory: normalizedHistory,
    reservationHistoryPagination: historyResponse?.pagination,
    reservationDetail: detailResponse,
    isPendingReservationsLoading,
    isPendingReservationsFetching,
    isReservationHistoryLoading,
    isReservationHistoryFetching,
    isReservationDetailLoading,
    isReservationDetailFetching,
    // Mutations state
    isCancellingReservation: cancelReservationMutation.isPending,
    isConfirmingReservation: confirmReservationMutation.isPending,
    // Actions
    createReservation,
    isCreatingReservation: createReservationMutation.isPending,
    cancelReservation,
    confirmReservation,
  };
}
