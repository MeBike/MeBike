"use client";

import { useEffect, useState, Dispatch, SetStateAction } from "react";

import { useUserActions } from "@/hooks/use-user";
import { useNFCCardActions } from "@/hooks/use-nfc";
import { useDebounce } from "@/utils/useDebounce";
import { LoadingScreen } from "@/components/loading-screen/loading-screen"
import type { DetailUser, Pagination, VerifyStatus, GetUserDashboardStatsResponse } from "@custom-types";
import CustomersClient from "./CustomerClient";
type UserStatusFilter = VerifyStatus | "BANNED" | "" | "all";

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyFilter, setVerifyFilter] = useState<UserStatusFilter>("");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 7;
  const accountStatusQuery = verifyFilter === "BANNED" ? "BANNED" : "";
  const debouncedSearch = useDebounce(searchQuery, 500);
  const {
    users,
    getAllUsers,
    isLoading,
    getAllStatistics,
    paginationUser,
    dashboardStatsData,
    getRefetchDashboardStats,
  } = useUserActions({
    hasToken: true,
    limit: limit,
    page: currentPage,
    verify: verifyFilter === "BANNED" ? "" : verifyFilter, 
    accountStatus: accountStatusQuery,
    fullName: debouncedSearch,
  });

  const {
    nfcCards,
    assignNFC,
    unassignNFC,
    updateStatusNFC,
    isAssigning,
    isUnassigning,
    isUpdatingStatus,
  } = useNFCCardActions({
    page: 1,
    pageSize: 200,
  });

  // Tự động quay về trang 1 khi thay đổi nội dung tìm kiếm hoặc bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, verifyFilter]);

  useEffect(() => {
    getAllUsers();
    getAllStatistics();
    getRefetchDashboardStats();
  }, [
    debouncedSearch,
    verifyFilter,
    currentPage,
    getAllUsers,
    getAllStatistics,
    getRefetchDashboardStats,
  ]);

  const handleReset = () => {
    setSearchQuery("");
    setVerifyFilter("");
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isLoading) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isVisualLoading) {
    return <LoadingScreen />;
  }
 
  return (
    <CustomersClient
      data={{
        users: users || [],
        dashboardStatsData,
        paginationUser,
        isVisualLoading,
        nfcCardsList: nfcCards?.data || [],
        isAssigning,
        isUnassigning,
        isUpdatingStatus,
      }}
      filters={{
        searchQuery,
        verifyFilter,
        currentPage,
      }}
      actions={{
        setSearchQuery,
        setVerifyFilter,
        setCurrentPage,
        handleReset,
        handleFilterChange,
        assignNFC,
        unassignNFC,
        updateStatusNFC,
      }}
    />
  );
}