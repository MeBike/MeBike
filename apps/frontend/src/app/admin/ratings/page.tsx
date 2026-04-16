"use client";

import { useState, useEffect } from "react";
import RatingClient from "./RatingClient";
import { useRatingAction } from "@/hooks/use-rating";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export default function Page() {
  const [page, setPage] = useState<number>(1);
  const pageSize = 7;
  const { ratings, isLoadingRatings, getRating } = useRatingAction({
    hasToken: true,
    page: page,
    pageSize: pageSize,
  });
  useEffect(() => {
    getRating();
  }, [page, getRating]);
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);
  useEffect(() => {
    if (isLoadingRatings) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingRatings]);
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (!ratings) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin các đánh giá.
        </p>
      </div>
    );
  }
  return (
    <RatingClient
      data={{
        ratings: ratings?.data ?? [],
        pagination: ratings?.pagination,
        isVisualLoading,
      }}
      filters={{
        page,
      }}
      actions={{
        setPage,
      }}
    />
  );
}
