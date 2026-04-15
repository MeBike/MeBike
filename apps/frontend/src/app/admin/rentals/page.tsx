"use client";

import { useState, useEffect } from "react";
import RentalClient from "./RentalClient";
import { useRentalsActions } from "@/hooks/use-rental";
import type { RentalStatus } from "@custom-types";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export default function Page() {
  // 1. QUẢN LÝ STATE
  const [page, setPage] = useState<number>(1);
  const limit = 7;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RentalStatus | "">("");

  // 2. GỌI API
  const {
    allRentalsData,
    pagination,
    getTodayRevenue,
    summaryRental,
    getRentals,
    getSummaryRental,
    isAllRentalsLoading,
  } = useRentalsActions({
    hasToken: true,
    limit: limit,
    page: page,
    ...(statusFilter !== "" && { status: statusFilter as RentalStatus }),
  });

  // 3. EFFECTS GỌI DATA
  useEffect(() => {
    getTodayRevenue();
  }, [getTodayRevenue]);

  useEffect(() => {
    getRentals();
  }, [getRentals, page, statusFilter]);

  useEffect(() => {
    getSummaryRental();
  }, [getSummaryRental]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // 4. XỬ LÝ LOADING MƯỢT MÀ
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);

  // 5. CÁC HÀM XỬ LÝ SỰ KIỆN
  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("");
  };

  useEffect(() => {
    if (isAllRentalsLoading) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isAllRentalsLoading]);

  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (!allRentalsData) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin các phiên thuê.
        </p>
      </div>
    );
  }
  return (
    <RentalClient
      data={{
        rentals: allRentalsData || [],
        summaryRental,
        pagination,
        isVisualLoading,
      }}
      filters={{
        searchQuery,
        statusFilter,
      }}
      actions={{
        setSearchQuery,
        setStatusFilter,
        setPage,
        handleReset,
      }}
    />
  );
}
