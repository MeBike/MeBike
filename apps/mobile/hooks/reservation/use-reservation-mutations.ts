import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { Alert } from "react-native";

import { useCancelReservationMutation } from "../mutations/reservation/use-cancel-reservation-mutation";
import { useConfirmReservationMutation } from "../mutations/reservation/use-confirm-reservation-mutation";
import { useCreateReservationMutation } from "../mutations/reservation/use-create-reservation-mutation";
import { useReservationCache } from "./use-reservation-cache";
import { getReservationErrorCode, getReservationErrorMessage } from "./use-reservation-errors";

type ReservationOption = "MỘT LẦN" | "GÓI THÁNG";

type MutationCallbacks = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

type CreateReservationOptions = {
  reservationOption?: ReservationOption;
  subscriptionId?: string;
  callbacks?: MutationCallbacks;
};

type UseReservationMutationsParams = {
  ensureAuthenticated: () => boolean;
};

const RESERVATION_BUFFER_MS = 2 * 60 * 1000;

function mapOptionToApiValue(option: ReservationOption): "ONE_TIME" | "SUBSCRIPTION" {
  return option === "GÓI THÁNG" ? "SUBSCRIPTION" : "ONE_TIME";
}

export function useReservationMutations({ ensureAuthenticated }: UseReservationMutationsParams) {
  const navigation = useNavigation();
  const { invalidateReservationQueries } = useReservationCache();

  const createReservationMutation = useCreateReservationMutation();
  const cancelReservationMutation = useCancelReservationMutation();
  const confirmReservationMutation = useConfirmReservationMutation();

  const createReservation = useCallback(
    (
      bikeId: string,
      stationId: string,
      startTime?: string,
      options?: CreateReservationOptions,
    ) => {
      if (!ensureAuthenticated()) {
        return;
      }

      const startIso = startTime
        ? new Date(startTime).toISOString()
        : new Date(Date.now() + RESERVATION_BUFFER_MS).toISOString();

      const reservationOption = options?.reservationOption ?? "MỘT LẦN";
      const payload = {
        bikeId,
        stationId,
        startTime: startIso,
        reservationOption: mapOptionToApiValue(reservationOption),
        ...(reservationOption === "GÓI THÁNG" && options?.subscriptionId
          ? { subscriptionId: options.subscriptionId }
          : {}),
      };

      createReservationMutation.mutate(payload, {
        onSuccess: () => {
          Alert.alert("Thành công", "Đặt xe thành công.");
          invalidateReservationQueries(true);
          options?.callbacks?.onSuccess?.();
        },
        onError: (error) => {
          const code = getReservationErrorCode(error);
          const message = getReservationErrorMessage(
            error,
            "Không thể đặt xe, vui lòng thử lại sau.",
          );

          if (code === "INSUFFICIENT_WALLET_BALANCE") {
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
              ],
            );
          }
          else {
            Alert.alert("Lỗi đặt xe", message);
          }

          options?.callbacks?.onError?.(message);
        },
      });
    },
    [createReservationMutation, ensureAuthenticated, invalidateReservationQueries, navigation],
  );

  const cancelReservation = useCallback(
    (
      reservationIdToCancel: string,
      _reason: string = "Huỷ đặt trước trên ứng dụng",
      callbacks?: MutationCallbacks,
    ) => {
      if (!ensureAuthenticated()) {
        return;
      }

      cancelReservationMutation.mutate(reservationIdToCancel, {
        onSuccess: () => {
          Alert.alert("Thành công", "Huỷ đặt trước thành công.");
          invalidateReservationQueries();
          callbacks?.onSuccess?.();
        },
        onError: (error) => {
          const message = getReservationErrorMessage(
            error,
            "Không thể huỷ đặt trước, vui lòng thử lại.",
          );
          Alert.alert("Lỗi huỷ đặt trước", message);
          callbacks?.onError?.(message);
        },
      });
    },
    [cancelReservationMutation, ensureAuthenticated, invalidateReservationQueries],
  );

  const confirmReservation = useCallback(
    (reservationIdToConfirm: string, callbacks?: MutationCallbacks) => {
      if (!ensureAuthenticated()) {
        return;
      }

      confirmReservationMutation.mutate(reservationIdToConfirm, {
        onSuccess: () => {
          Alert.alert("Thành công", "Bắt đầu hành trình của bạn ngay thôi!");
          invalidateReservationQueries();
          callbacks?.onSuccess?.();
        },
        onError: (error) => {
          const message = getReservationErrorMessage(
            error,
            "Không thể xác nhận đặt trước, vui lòng thử lại.",
          );
          Alert.alert("Lỗi xác nhận", message);
          callbacks?.onError?.(message);
        },
      });
    },
    [confirmReservationMutation, ensureAuthenticated, invalidateReservationQueries],
  );

  return {
    createReservation,
    cancelReservation,
    confirmReservation,
    isCreatingReservation: createReservationMutation.isPending,
    isCancellingReservation: cancelReservationMutation.isPending,
    isConfirmingReservation: confirmReservationMutation.isPending,
  };
}
