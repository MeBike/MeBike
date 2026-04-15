import { useCancelFixedSlotTemplateMutation } from "@hooks/mutations/fixed-slots/use-cancel-fixed-slot-template-mutation";
import { useRemoveFixedSlotTemplateDateMutation } from "@hooks/mutations/fixed-slots/use-remove-fixed-slot-template-date-mutation";
import { useFixedSlotTemplateDetailQuery } from "@hooks/query/fixed-slots/use-fixed-slot-template-detail-query";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { Alert } from "react-native";

import type { FixedSlotDetailNavigationProp } from "@/types/navigation";

import { getFixedSlotStatusTone, presentFixedSlotError, presentFixedSlotStatus } from "@/presenters/fixed-slots/fixed-slot-presenter";

import { formatDisplayDate } from "./utils";

type UseFixedSlotDetailScreenParams = {
  navigation: FixedSlotDetailNavigationProp;
  templateId: string;
};

export function useFixedSlotDetailScreen({ navigation, templateId }: UseFixedSlotDetailScreenParams) {
  const queryClient = useQueryClient();
  const cancelMutation = useCancelFixedSlotTemplateMutation();
  const removeDateMutation = useRemoveFixedSlotTemplateDateMutation();
  const detailQuery = useFixedSlotTemplateDetailQuery(templateId, true);

  const template = detailQuery.data;
  const templateCode = useMemo(() => templateId.split("-")[1]?.toUpperCase() ?? templateId, [templateId]);
  const statusLabel = template ? presentFixedSlotStatus(template.status) : undefined;
  const statusTone = template ? getFixedSlotStatusTone(template.status) : undefined;
  const canMutate = template?.status === "ACTIVE";

  const syncTemplate = useCallback((nextTemplate: NonNullable<typeof template>) => {
    queryClient.setQueryData(["fixed-slots", "detail", templateId], nextTemplate);
    queryClient.invalidateQueries({ queryKey: ["fixed-slots"] });
  }, [queryClient, templateId]);

  const handleNavigateToEditor = useCallback(() => {
    if (!template || !canMutate) {
      return;
    }

    navigation.navigate("FixedSlotEditor", {
      templateId,
      stationId: template.station.id,
      stationName: template.station.name,
    });
  }, [canMutate, navigation, template, templateId]);

  const handleRemoveDate = useCallback((slotDate: string) => {
    Alert.alert(
      "Xóa ngày áp dụng",
      `Bạn có chắc muốn xóa ngày ${formatDisplayDate(slotDate)}? Sẽ không được hoàn tiền cho ngày đã xóa.`,
      [
        { text: "Đóng", style: "cancel" },
        {
          text: "Xóa ngày",
          style: "destructive",
          onPress: () => {
            removeDateMutation.mutate(
              { id: templateId, slotDate },
              {
                onSuccess: syncTemplate,
                onError: error => Alert.alert("Không thể xóa ngày", presentFixedSlotError(error, "Vui lòng thử lại sau.")),
              },
            );
          },
        },
      ],
    );
  }, [removeDateMutation, syncTemplate, templateId]);

  const handleCancelTemplate = useCallback(() => {
    Alert.alert(
      "Hủy toàn bộ lịch đặt",
      "Hủy toàn bộ lịch đặt này? Bạn sẽ không được hoàn lại tiền cho các ngày chưa sử dụng.",
      [
        { text: "Đóng", style: "cancel" },
        {
          text: "Hủy toàn bộ",
          style: "destructive",
          onPress: () => {
            cancelMutation.mutate(templateId, {
              onSuccess: syncTemplate,
              onError: error => Alert.alert("Không thể hủy khung giờ", presentFixedSlotError(error, "Vui lòng thử lại sau.")),
            });
          },
        },
      ],
    );
  }, [cancelMutation, syncTemplate, templateId]);

  return {
    template,
    isLoading: detailQuery.isLoading,
    statusLabel,
    statusTone,
    templateCode,
    canMutate,
    handleNavigateToEditor,
    handleRemoveDate,
    handleCancelTemplate,
  };
}
