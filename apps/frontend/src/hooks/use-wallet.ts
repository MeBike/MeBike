import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useGetAllWalletQuery } from "./query/Wallet/useGetAllWalletQuery";
import { useTopUpWalletMutation } from "./mutations/Wallet/useTopUpWalletMutation";
import { useDebitWalletMutation } from "./mutations/Wallet/useDebitWalletMutation";
import {
  DecreaseSchemaFormData,
  TopUpSchemaFormData,
} from "@/schemas/walletSchema";
import { toast } from "sonner";
import { useGetManageTransactionQuery } from "./query/Wallet/useGetManageTransactionQuery";
import { useGetWalletOverviewQuery } from "./query/Wallet/useGetWalletOverviewQuery";
import { useGetDetailWalletQuery } from "./query/Wallet/useGetDetailWalletQuery";
import { useUpdateStatusWalletMutation } from "./mutations/Wallet/useUpdateStatusWalletMutation";
import { useRouter } from "next/navigation";
import { QUERY_KEYS , HTTP_STATUS , MESSAGE } from "@constants/index";
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
function getErrorMessage(error: unknown, defaultMessage: string): string {
  const axiosError = error as ErrorResponse;
  if (axiosError?.response?.data) {
    const { errors, message } = axiosError.response.data;
    if (errors) {
      const firstError = Object.values(errors)[0];
      if (firstError?.msg) return firstError.msg;
    }
    if (message) return message;
  }
  const simpleError = error as ErrorWithMessage;
  if (simpleError?.message) {
    return simpleError.message;
  }

  return defaultMessage;
}
export function useWalletActions(
  hasToken: boolean,
  page?: number,
  limit?: number,
  user_id?: string
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: allWallets, refetch: isRefetchingAllWallets } =
    useGetAllWalletQuery({ page, limit });
  const { data: manageTransactions } = useGetManageTransactionQuery({
    page: 1,
    limit: 5,
  });
  const { data: walletOverview , refetch : isRefetchingWalletOverview} = useGetWalletOverviewQuery();
  const getWalletOverview = useCallback(async () => {
    if (!hasToken) {
      return;
    }
    isRefetchingWalletOverview();
  }, [isRefetchingWalletOverview, hasToken]);
  const useTopUpWallet = useTopUpWalletMutation();
  const useDebitWallet = useDebitWalletMutation();
  const {
    data: detailWallet,
    refetch: isRefetchingDetailWallet,
    isLoading: isLoadingDetailWallet,
  } = useGetDetailWalletQuery(user_id || "");
  const getAllWalletUser = useCallback(async () => {
    if (!hasToken) {
      return;
    }
    isRefetchingAllWallets();
  }, [isRefetchingAllWallets, hasToken]);
  const topUpWallet = useCallback(
    (data: TopUpSchemaFormData) => {
      if (!hasToken) {
        return;
      }
      useTopUpWallet.mutate(data, {
        onSuccess: (result) => {
          if (result.status === HTTP_STATUS.OK) {
            toast.success(
              result.data?.message || MESSAGE.TOP_UP_WALLET_SUCCESS
            );
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.WALLET.ALL_WALLET_USER(),
            });
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.WALLET.WALLET_OVERVIEW,
            });
          } else {
            const errorMessage =
              result.data?.message || MESSAGE.TOP_UP_WALLET_FAILED;
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(
            error,
            MESSAGE.TOP_UP_WALLET_FAILED
          );
          toast.error(errorMessage);
        },
      });
    },
    [useTopUpWallet, hasToken, queryClient, page, limit]
  );
  const debitWallet = useCallback(
    (data: DecreaseSchemaFormData) => {
      if (!hasToken) {
        return;
      }
      useDebitWallet.mutate(data, {
        onSuccess: (result) => {
          if (result.status === HTTP_STATUS.OK) {
            toast.success(result.data?.message || MESSAGE.DEBIT_WALLET_SUCCESS);
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.WALLET.ALL_WALLET_USER(),
            });
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.WALLET.WALLET_OVERVIEW,
            });
          } else {
            const errorMessage =
              result.data?.message || MESSAGE.DEBIT_WALLET_FAILED;
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, MESSAGE.DEBIT_WALLET_FAILED);
          toast.error(errorMessage);
        },
      });
    },
    [useDebitWallet, hasToken, queryClient, page, limit]
  );
  const getDetailWallet = useCallback(async () => {
    if (!hasToken) {
      return;
    }
    isRefetchingDetailWallet();
  }, [isRefetchingDetailWallet, hasToken]);
  const useUpdateWallet = useUpdateStatusWalletMutation();
  const updateStatusWallet = useCallback(
    (newStatus: "ĐANG HOẠT ĐỘNG" | "ĐÃ BỊ ĐÓNG BĂNG", id: string) => {
      if (!hasToken) {
        router.push("/login");
        return;
      }
      useUpdateWallet.mutate(
        { id, newStatus },
        {
          onSuccess: (result: {
            status: number;
            data?: { message?: string };
          }) => {
            if (result.status === HTTP_STATUS.OK) {
              toast.success(result.data?.message || MESSAGE.UPDATE_STATUS_WALLET_SUCCESS);
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.WALLET.ALL_WALLET_USER(),
              });
            } else {
              const errorMessage =
                result.data?.message || MESSAGE.UPDATE_STATUS_WALLET_FAILED;
              toast.error(errorMessage);
            }
          },
          onError: (error) => {
            const errorMessage = getErrorMessage(
              error,
              MESSAGE.UPDATE_STATUS_WALLET_FAILED
            );
            toast.error(errorMessage);
          },
        }
      );
    },
    [useUpdateWallet, hasToken, router, queryClient, page, limit]
  );
  return {
    allWallets: allWallets?.data || [],
    getAllWalletUser,
    paginationWallet: allWallets?.pagination,
    debitWallet,
    topUpWallet,
    manageTransactions,
    walletOverview,
    detailWallet,
    getDetailWallet,
    isLoadingDetailWallet,
    updateStatusWallet,
    getWalletOverview,
  };
}
