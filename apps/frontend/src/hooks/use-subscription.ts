import { HTTP_STATUS } from "@/constants";
import {
  useGetSubscriptionsQuery,
  useGetSubscriptionDetailQuery,
} from "./query/Subscription";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
interface SubscriptionActionProps {
  hasToken: boolean;
  subcription_id  ?: string;
  page: number;
  pageSize: number;
}
export const useSubscriptionAction = ({
  hasToken,
  subcription_id,
  page,
  pageSize,
}: SubscriptionActionProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const {
    data: subscriptionsData,
    refetch: refetchSubscriptions,
    isLoading: isLoadingSubscriptions,
  } = useGetSubscriptionsQuery({ page, pageSize });
  const getSubscriptions = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchSubscriptions();
  }, [refetchSubscriptions, hasToken]);
  const {
    data: subscriptionDetail,
    refetch: refetchSubscriptionDetail,
    isLoading: isLoadingSubscriptionDetail,
  } = useGetSubscriptionDetailQuery({ id: subcription_id || ""});
  const getSubscriptionDetail = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchSubscriptionDetail();
  }, [refetchSubscriptionDetail, hasToken]);
  return {
    subscriptionsData,
    getSubscriptions,
    isLoadingSubscriptions,
    subscriptionDetail,
    getSubscriptionDetail,
    isLoadingSubscriptionDetail,
  };
};
