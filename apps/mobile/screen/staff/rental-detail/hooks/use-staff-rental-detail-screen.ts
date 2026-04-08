import { useStaffEndRentalMutation } from "@hooks/mutations/rentals/use-staff-end-rental-mutation";
import { useStaffRentalDetailQuery } from "@hooks/query/rentals/use-staff-rental-detail-query";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { presentRentalError } from "@/presenters/rentals/rental-error-presenter";
import { useAuthNext } from "@/providers/auth-provider-next";

type EndRentalPayload = {
  stationId: string;
  reason: string;
  confirmationMethod?: "MANUAL" | "QR_CODE";
  confirmedAt?: string;
};

type EndRentalCallbacks = {
  onError?: () => void;
  onSuccess?: () => void;
};

export function useStaffRentalDetailScreen(rentalId: string) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuthNext();

  const {
    data: booking,
    isLoading: isRentalLoading,
    isError,
    refetch: refetchRental,
  } = useStaffRentalDetailQuery(rentalId, true);

  const endRentalMutation = useStaffEndRentalMutation();
  const operatorStation = user?.orgAssignment?.station ?? null;

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchRental();
    }
    finally {
      setIsRefreshing(false);
    }
  }, [refetchRental]);

  const handleEndRental = useCallback(
    ({ stationId, reason, confirmationMethod, confirmedAt }: EndRentalPayload, callbacks?: EndRentalCallbacks) => {
      const returnSlot = booking?.returnSlot;
      const resolvedStationId = stationId || returnSlot?.station.id || operatorStation?.id || "";

      if (!resolvedStationId) {
        Alert.alert("Thiếu thông tin", "Vui lòng chọn trạm kết thúc.");
        return;
      }

      if (returnSlot && resolvedStationId !== returnSlot.station.id) {
        Alert.alert(
          "Sai trạm trả xe",
          `Phiên này chỉ có thể kết thúc tại ${returnSlot.station.name} vì đó là trạm khách đã giữ chỗ.`,
        );
        return;
      }

      endRentalMutation.mutate(
        {
          rentalId,
          stationId: resolvedStationId,
          reason,
          confirmationMethod: confirmationMethod ?? "MANUAL",
          confirmedAt,
        },
        {
          onSuccess: () => {
            Alert.alert("Thành công", "Đã kết thúc phiên thuê cho khách.");
            callbacks?.onSuccess?.();
          },
          onError: (error) => {
            Alert.alert("Thất bại", presentRentalError(error));
            callbacks?.onError?.();
          },
        },
      );
    },
    [booking?.returnSlot, endRentalMutation, operatorStation?.id, rentalId],
  );

  return {
    booking,
    handleEndRental,
    isEndingRental: endRentalMutation.isPending,
    isError,
    isInitialLoading: isRentalLoading,
    operatorStation,
    isRefreshing,
    onRefresh,
  };
}
