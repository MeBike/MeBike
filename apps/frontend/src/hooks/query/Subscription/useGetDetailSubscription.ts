import { useQuery } from "@tanstack/react-query";
import { subscriptionSerive } from "@/services/subscription.service";

const fetchSubscriptionDetail = async ({ id }: { id: string }) => {
  try {
    const response = await subscriptionSerive.getDetalSubscription({ id });
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const useGetSubscriptionDetailQuery = ({ id }: { id: string }) => {
  return useQuery({
    queryKey: ["detail", "subscriptions"],
    queryFn: () => fetchSubscriptionDetail({ id }),
    enabled: false,
  });
};
