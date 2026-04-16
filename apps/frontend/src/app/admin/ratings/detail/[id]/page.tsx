// app/admin/ratings/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DetailRating from "./RatingDetail";
import { Loader2 } from "lucide-react";
import { useRatingAction } from "@/hooks/use-rating";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export default function RatingDetailPage() {
  const params = useParams();
  const ratingId = params.id as string;
  const { isLoadingRatingDetail, ratingDetail, getRatingDetail } =
    useRatingAction({ hasToken: true, id: ratingId });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (ratingId) {
      getRatingDetail();
    }
  }, [ratingId]);
  useEffect(() => {
    if (isLoadingRatingDetail) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingRatingDetail]);
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (!ratingDetail) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin đánh giá.
        </p>
      </div>
    );
  }
  return (
    <div className="container mx-auto py-6">
      <DetailRating rating={ratingDetail} />
    </div>
  );
}
