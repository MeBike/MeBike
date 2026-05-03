"use client";

import { useEffect, useState } from "react";
import CustomersClient from "./CustomerClient";
import { useUserActions } from "@/hooks/use-user";
import { useNFCCardActions } from "@/hooks/use-nfc";
import type { VerifyStatus, UserRole } from "@custom-types";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";

type UserStatusFilter = VerifyStatus | "BANNED" | "all";

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyFilter, setVerifyFilter] = useState<UserStatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const limit = 10;
  const verifyQuery =
    verifyFilter === "VERIFIED" || verifyFilter === "UNVERIFIED"
      ? verifyFilter
      : "";
  const accountStatusQuery = verifyFilter === "BANNED" ? "BANNED" : "";

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
    verify: verifyFilter === "all" ? "" : verifyQuery,
    accountStatus: verifyFilter === "all" ? "" : accountStatusQuery,
    fullName: debouncedSearch,
  });

  // Khởi tạo các hàm quản lý NFC (Thêm updateStatusNFC và trạng thái isUpdatingStatus)
  const { 
    nfcCards, 
    assignNFC, 
    unassignNFC, 
    updateStatusNFC, 
    isAssigning, 
    isUnassigning, 
    isUpdatingStatus 
  } = useNFCCardActions({
    page: 1,
    pageSize: 200, 
  });

  useEffect(() => {
    getAllUsers();
    getAllStatistics();
    getRefetchDashboardStats();
  }, [
    debouncedSearch,
    verifyFilter,
    roleFilter,
    currentPage,
    getAllUsers,
    getAllStatistics,
    getRefetchDashboardStats,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter]);

  const handleReset = () => {
    setSearchQuery("");
    setVerifyFilter("all");
    setRoleFilter("all");
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

  if (!users) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin các người dùng.
        </p>
      </div>
    );
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
        isUpdatingStatus, // Truyền xuống
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
        updateStatusNFC, // Truyền xuống
      }}
    />
  );
}