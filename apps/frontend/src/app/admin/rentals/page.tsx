"use client";

import { useState, useEffect } from "react";
import RentalClient from "./RentalClient";
import { useRentalsActions } from "@/hooks/use-rental";
import type { RentalStatus } from "@custom-types";

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

  // 5. CÁC HÀM XỬ LÝ SỰ KIỆN
  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("");
  };

  // 6. TRUYỀN DATA XUỐNG UI
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