"use client";

import { useState, useEffect } from "react";
import RatingClient from "./RatingClient";
import { useRatingAction } from "@/hooks/use-rating";

export default function Page() {
  // 1. QUẢN LÝ STATE
  const [page, setPage] = useState<number>(1);
  const pageSize = 7;

  // 2. GỌI API
  const {
    ratings,
    isLoadingRatings,
    getRating,
  } = useRatingAction({ hasToken: true, page: page, pageSize: pageSize });

  // 3. EFFECTS
  useEffect(() => {
    getRating();
  }, [page, getRating]);

  // 4. XỬ LÝ LOADING MƯỢT MÀ
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

  // 5. TRUYỀN DATA XUỐNG UI
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