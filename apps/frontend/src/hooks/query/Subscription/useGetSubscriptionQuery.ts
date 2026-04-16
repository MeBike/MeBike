import { useQuery } from "@tanstack/react-query";
import { subscriptionSerive } from "@/services/subscription.service";

const fetchSubscription = async ({
  page,
  pageSize,
}: {
  page?: number;
  pageSize?: number;
}) => {
  try {
    const response = await subscriptionSerive.getSubscription({page,pageSize});
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const useGetSubscriptionsQuery = ({
  page,
  pageSize,
}: {
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ["data", "subscriptions"],
    queryFn: () => fetchSubscription({ page, pageSize }),
    enabled:false,
  });
};
