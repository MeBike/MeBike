import { useGetDetailRatingQuery, useGetRatingQuery } from "@queries";
import { useCallback } from "react";
import { getErrorMessageFromBikeCode, getAxiosErrorCodeMessage } from "@utils";

import { useRouter } from "next/navigation";

export const useRatingAction = ({
  page,
  pageSize,
  id,
  hasToken,
}: {
  page?: number;
  pageSize?: number;
  id?: string;
  hasToken : boolean;
}) => {
  const router = useRouter();
  const {data : ratings , isLoading : isLoadingRatings , refetch : refetchRatings } = useGetRatingQuery({ page: page, pageSize: pageSize });
  const {data : ratingDetail , isLoading : isLoadingRatingDetail , refetch : refetchRatingDetail} = useGetDetailRatingQuery({id:id || ""});
  const getRating = useCallback(() => {
    if (!hasToken) {
      router.push("/login");
      return;
    }
    refetchRatings();
  }, [refetchRatings,hasToken, router,page]);
  const getRatingDetail = useCallback(() => {
    if(!hasToken) {
      router.push("/login");
      return;
    }
    if(!id) {
      return;
    }
  },[refetchRatingDetail,hasToken,id])
  return {
    ratings,
    isLoadingRatings,
    getRating,
    ratingDetail,
    isLoadingRatingDetail,
    getRatingDetail
  }
};
