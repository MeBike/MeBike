"use client";

import React, { useEffect, useState } from "react";
import ReservationDetailClient from "./ReservationDetail";
import { useReservationActions } from "@/hooks/use-reservation";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  const { detailReservation, fetchDetailReservation, isLoadingDetailReservation } =
    useReservationActions({
      hasToken: true,
      id: id,
    });

  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true); // Nên để true mặc định để chớp nhoáng ban đầu cũng show loading

  useEffect(() => {
    if (id) {
      fetchDetailReservation();
    }
  }, [id, fetchDetailReservation]);

  useEffect(() => {
    if (isLoadingDetailReservation) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingDetailReservation]);

  if (isVisualLoading) {
    return <LoadingScreen />;
  }

  if (!detailReservation) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin đặt chỗ.
        </p>
      </div>
    );
  }

  return <ReservationDetailClient />;
}
