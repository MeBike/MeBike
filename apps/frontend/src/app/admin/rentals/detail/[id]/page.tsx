"use client";

import React, { useEffect, useState } from "react";
import AdminRentalDetailClient from "./Client";
import { useRentalsActions } from "@/hooks/use-rental";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { detailData, isDetailLoading, getDetailRental } = useRentalsActions({
    hasToken: true,
    rental_id: id,
  });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isDetailLoading) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isDetailLoading]);
  useEffect(() => {
    if (id) {
      getDetailRental();
    }
  }, [getDetailRental, id]);
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (!detailData) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin phiên thuê.
        </p>
      </div>
    );
  }
  return (
    <AdminRentalDetailClient
      id={id}
      data={detailData}
      isLoading={isDetailLoading}
    />
  );
}
