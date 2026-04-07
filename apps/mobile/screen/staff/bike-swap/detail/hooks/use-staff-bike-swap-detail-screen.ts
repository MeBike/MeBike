import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { useApproveBikeSwapRequestMutation } from "@/hooks/mutations/rentals/use-approve-bike-swap-request-mutation";
import { useRejectBikeSwapRequestMutation } from "@/hooks/mutations/rentals/use-reject-bike-swap-request-mutation";
import { useStaffBikeSwapRequestQuery } from "@/hooks/query/rentals/use-staff-bike-swap-request-query";
import { presentRentalError } from "@/presenters/rentals/rental-error-presenter";

type UseStaffBikeSwapDetailScreenOptions = {
  bikeSwapRequestId: string;
  onResolved: () => void;
};

export function useStaffBikeSwapDetailScreen({
  bikeSwapRequestId,
  onResolved,
}: UseStaffBikeSwapDetailScreenOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRejectSheetOpen, setIsRejectSheetOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const requestQuery = useStaffBikeSwapRequestQuery(bikeSwapRequestId, true);
  const approveMutation = useApproveBikeSwapRequestMutation();
  const rejectMutation = useRejectBikeSwapRequestMutation();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await requestQuery.refetch();
    }
    finally {
      setIsRefreshing(false);
    }
  }, [requestQuery]);

  const closeRejectSheet = useCallback(() => {
    setIsRejectSheetOpen(false);
    setRejectReason("");
  }, []);

  const handleApprove = useCallback(() => {
    const request = requestQuery.data;
    if (!request) {
      return;
    }

    approveMutation.mutate(
      { bikeSwapRequestId: request.id },
      {
        onSuccess: () => {
          Alert.alert("Đã chấp nhận", "Hệ thống đã cấp xe mới cho khách.", [
            {
              text: "Đóng",
              onPress: onResolved,
            },
          ]);
        },
        onError: (error) => {
          Alert.alert("Không thể chấp nhận", presentRentalError(error));
        },
      },
    );
  }, [approveMutation, onResolved, requestQuery.data]);

  const handleSubmitReject = useCallback(() => {
    const request = requestQuery.data;
    const reason = rejectReason.trim();

    if (!request) {
      return;
    }

    if (!reason) {
      Alert.alert("Thiếu lý do", "Vui lòng nhập lý do từ chối trước khi tiếp tục.");
      return;
    }

    rejectMutation.mutate(
      {
        bikeSwapRequestId: request.id,
        payload: { reason },
      },
      {
        onSuccess: () => {
          closeRejectSheet();
          Alert.alert("Đã từ chối", "Yêu cầu đổi xe đã được cập nhật cho khách hàng.", [
            {
              text: "Đóng",
              onPress: onResolved,
            },
          ]);
        },
        onError: (error) => {
          Alert.alert("Không thể từ chối", presentRentalError(error));
        },
      },
    );
  }, [closeRejectSheet, onResolved, rejectMutation, rejectReason, requestQuery.data]);

  return {
    closeRejectSheet,
    handleApprove,
    handleRefresh,
    handleSubmitReject,
    isDecisionPending: approveMutation.isPending || rejectMutation.isPending,
    isError: requestQuery.isError,
    isInitialLoading: requestQuery.isLoading && !requestQuery.data,
    isRefreshing,
    isRejectSheetOpen,
    openRejectSheet: () => setIsRejectSheetOpen(true),
    rejectReason,
    request: requestQuery.data,
    setRejectReason,
  };
}
