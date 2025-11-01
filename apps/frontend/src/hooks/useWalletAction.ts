import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useGetAllWalletQuery } from "./query/Wallet/useGetAllWalletQuery";
import { useTopUpWalletMutation } from "./mutations/Wallet/useTopUpWalletMutation";
import { useDebitWalletMutation } from "./mutations/Wallet/useDebitWalletMutation";
import { DecreaseSchemaFormData, TopUpSchemaFormData } from "@/schemas/walletSchema";
import { toast } from "sonner";
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
  limit?: number
) {
  const queryClient = useQueryClient();
  const { data: allWallets, refetch: isRefetchingAllWallets } =
    useGetAllWalletQuery({ page, limit });
  const useTopUpWallet = useTopUpWalletMutation();
  const useDebitWallet = useDebitWalletMutation();
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
          if (result.status === 201) {
            toast.success("Bike created successfully");
          } else {
            const errorMessage = result.data?.message || "Error creating bikes";
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, "Error creating bikes");
          toast.error(errorMessage);
        },
      });
    },
    [useTopUpWallet, hasToken]
  );
  const debitWallet = useCallback(
    (data: DecreaseSchemaFormData) => {
      if (!hasToken) {
        return;
      }
      useDebitWallet.mutate(data, {
        onSuccess: (result) => {
          if (result.status === 201) {
            toast.success("Bike created successfully");
          } else {
            const errorMessage = result.data?.message || "Error creating bikes";
            toast.error(errorMessage);
          }
        },
        onError: (error) => {
          const errorMessage = getErrorMessage(error, "Error creating bikes");
          toast.error(errorMessage);
        },
      });
    },
    [useTopUpWallet, hasToken]
  );
  return {
    allWallets: allWallets?.data || [],
    getAllWalletUser,
    paginationWallet: allWallets?.pagination,
    debitWallet,
    topUpWallet,
  };
}
