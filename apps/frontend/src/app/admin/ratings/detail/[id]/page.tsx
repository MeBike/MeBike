// app/admin/ratings/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import DetailRating from "./RatingDetail";
import { Loader2 } from "lucide-react";
import { useRatingAction } from "@/hooks/use-rating";
export default function RatingDetailPage() {
  const params = useParams();
  const ratingId = params.id as string;

  const {
    isLoadingRatingDetail,
    ratingDetail,
    getRatingDetail
  } = useRatingAction({ hasToken: true , id : ratingId});

  useEffect(() => {
    if (ratingId) {
      getRatingDetail();
    }
  }, [ratingId]);

  if (isLoadingRatingDetail) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Đang tải dữ liệu đánh giá...</span>
      </div>
    );
  }

  if (!ratingDetail) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Không tìm thấy thông tin đánh giá!</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <DetailRating rating={ratingDetail} />
    </div>
  );
}