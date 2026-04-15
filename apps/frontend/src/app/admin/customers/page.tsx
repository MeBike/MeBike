"use client";

import { useEffect, useState } from "react";
import CustomersClient from "./CustomerClient";
import { useUserActions } from "@/hooks/use-user";
import type { VerifyStatus, UserRole } from "@custom-types";

type UserStatusFilter = VerifyStatus | "BANNED" | "all";

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyFilter, setVerifyFilter] = useState<UserStatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
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
    fullName: searchQuery,
  });
  useEffect(() => {
    getAllUsers();
    getAllStatistics();
    getRefetchDashboardStats();
  }, [
    searchQuery,
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
  const [isVisualLoading, setIsVisualLoading] = useState(true);
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
  const handleReset = () => {
    setSearchQuery("");
    setVerifyFilter("all");
    setRoleFilter("all");
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };
  return (
    <CustomersClient
      data={{
        users: users || [],
        dashboardStatsData,
        paginationUser,
        isVisualLoading,
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
      }}
    />
  );
}