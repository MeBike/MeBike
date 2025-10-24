import { useQueryClient } from "@tanstack/react-query";
import { useGetAllUserQuery } from "./query/User/useGetAllUserQuery";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { VerifyStatus } from "@/types";
interface ErrorWithMessage {
  message: string;
}
interface ErrorResponse {
  response?: {
    data?: {
      errors?: Record<string, { msg?: string }>;
      message?: string;
    };
  };
}

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
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
};
export const useUserActions = ({
  hasToken,
  verify,
  role,
  limit,
  page,
}: {
  hasToken: boolean;
  verify?: VerifyStatus;
  role?: "ADMIN" | "USER" | "STAFF" | "";
  limit?: number;
  page?: number;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data , refetch , isFetching } = useGetAllUserQuery({
    page,
    limit,
    role: role || "",
    verify: verify || "",
  });
  const getAllUsers = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetch();
  }, [hasToken, queryClient, router]);
  return {
    users : data?.data,
    refetch,
    isFetching,
    getAllUsers,
  };
};