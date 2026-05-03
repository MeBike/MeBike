import { useQueryClient } from "@tanstack/react-query";
import {
  useGetListNFCQuery,
  useGetNFCDetailQuery,
} from "@queries";
import {
  useCreateNFCMutation,
  useAssignNFCMutation,
  useUnassignNFCMutation,
  useUpdateStatusNFCMutation,
} from "@mutations";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { HTTP_STATUS } from "@/constants";
import { toast } from "sonner";
import {
  getErrorMessageFromNFCCode,
  getAxiosErrorCodeMessage,
} from "@utils";
export interface NFCCardActionProps {
  page?: number;
  pageSize?: number;
  id?: string;
}
export const useNFCCardActions = ({
  page,
  pageSize,
  id,
}: NFCCardActionProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: nfcCards,
    refetch: refetchGetNFCCards,
    isLoading: isLoadingNFCCards,
  } = useGetListNFCQuery({
    page: page || 1,
    pageSize: pageSize || 7,
  });

  const getNFCCards = useCallback(() => {
    refetchGetNFCCards();
  }, [refetchGetNFCCards]);

  const {
    data: nfcCardDetail,
    refetch: refetchGetNFCCardDetail,
    isLoading: isLoadingNFCCardDetail,
  } = useGetNFCDetailQuery({ id: id || "" });

  const getNFCCardDetail = useCallback(() => {
    refetchGetNFCCardDetail();
  }, [refetchGetNFCCardDetail]);

  const useCreateNFC = useCreateNFCMutation();
  const useAssignNFC = useAssignNFCMutation();
  const useUnassignNFC = useUnassignNFCMutation();
  const useUpdateStatusNFC = useUpdateStatusNFCMutation();

  const createNFC = useCallback(async (data: { uid: string }) => {
    try {
      const result = await useCreateNFC.mutateAsync({ data });
      if (result.status === HTTP_STATUS.CREATED) {
        toast.success("Tạo thẻ NFC thành công");
        queryClient.invalidateQueries({
          queryKey: ["data", "nfc-list"],
        });
      }
    } catch (error) {
      const error_code = getAxiosErrorCodeMessage(error);
      toast.error(getErrorMessageFromNFCCode(error_code));
      throw error;
    }
  }, [useCreateNFC, queryClient]);

  const assignNFC = useCallback(async ({ nfcId, userId }: { nfcId: string; userId: string }) => {
    try {
      const result = await useAssignNFC.mutateAsync({ nfcId, userId });
      if (result.status === HTTP_STATUS.OK) {
        toast.success("Gán thẻ NFC thành công");
        queryClient.invalidateQueries({
          queryKey: ["data", "nfc-list"],
        });
        queryClient.invalidateQueries({
          queryKey: ["data", "nfc-detail", nfcId],
        });
      }
    } catch (error) {
      const error_code = getAxiosErrorCodeMessage(error);
      toast.error(getErrorMessageFromNFCCode(error_code));
      throw error;
    }
  }, [useAssignNFC, queryClient]);

  const unassignNFC = useCallback(async ({ nfcId, userId }: { nfcId: string; userId: string }) => {
    try {
      const result = await useUnassignNFC.mutateAsync({ nfcId, userId });
      if (result.status === HTTP_STATUS.OK) {
        toast.success("Hủy gán thẻ NFC thành công");
        queryClient.invalidateQueries({
          queryKey: ["data", "nfc-list"],
        });
        queryClient.invalidateQueries({
          queryKey: ["data", "nfc-detail", nfcId],
        });
      }
    } catch (error) {
      const error_code = getAxiosErrorCodeMessage(error);
      toast.error(getErrorMessageFromNFCCode(error_code));
      throw error;
    }
  }, [useUnassignNFC, queryClient]);

  const updateStatusNFC = useCallback(async ({ nfcId, data }: { nfcId: string, data: any }) => {
    try {
      const result = await useUpdateStatusNFC.mutateAsync({ nfcId, data });
      if (result.status === HTTP_STATUS.OK) {
        toast.success("Cập nhật trạng thái thẻ NFC thành công");
        queryClient.invalidateQueries({
          queryKey: ["data", "nfc-list"],
        });
        queryClient.invalidateQueries({
          queryKey: ["data", "nfc-detail", nfcId],
        });
      }
    } catch (error) {
      const error_code = getAxiosErrorCodeMessage(error);
      toast.error(getErrorMessageFromNFCCode(error_code));
      throw error;
    }
  }, [useUpdateStatusNFC, queryClient]);

  return {
    nfcCards,
    getNFCCards,
    isLoadingNFCCards,
    nfcCardDetail,
    getNFCCardDetail,
    isLoadingNFCCardDetail,
    createNFC,
    assignNFC,
    unassignNFC,
    updateStatusNFC,
    isCreating: useCreateNFC.isPending,
    isAssigning: useAssignNFC.isPending,
    isUnassigning: useUnassignNFC.isPending,
    isUpdatingStatus: useUpdateStatusNFC.isPending,
  };
};
