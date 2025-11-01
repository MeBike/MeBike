import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useGetAllWalletQuery } from "./query/Wallet/useGetAllWalletQuery";

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
// function getErrorMessage(error: unknown, defaultMessage: string): string {
//   const axiosError = error as ErrorResponse;
//   if (axiosError?.response?.data) {
//     const { errors, message } = axiosError.response.data;
//     if (errors) {
//       const firstError = Object.values(errors)[0];
//       if (firstError?.msg) return firstError.msg;
//     }
//     if (message) return message;
//   }
//   const simpleError = error as ErrorWithMessage;
//   if (simpleError?.message) {
//     return simpleError.message;
//   }

//   return defaultMessage;
// }
export function useWalletActions(hasToken: boolean, limit: number = 5) {
  const queryClient = useQueryClient();
  const { data: allWallets, refetch: isRefetchingAllWallets } =
    useGetAllWalletQuery();
  const getAllWalletUser = useCallback(async () => {
    if (!hasToken) {
      return;
    }
    isRefetchingAllWallets();
  }, [isRefetchingAllWallets, hasToken]);
  return {
    allWallets,
    getAllWalletUser,
  };
}
