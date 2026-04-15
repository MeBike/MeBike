"use client";

import { useEffect, useState } from "react";
import StaffClient from "./StaffClient";
import { useUserActions } from "@/hooks/use-user";
import type { VerifyStatus, UserRole } from "@custom-types";

export type UserStatusFilter = VerifyStatus | "BANNED" | "all";

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyFilter, setVerifyFilter] = useState<UserStatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 7;
  const { staffOnly, isLoadingStaffOnly, getAllStaffs } = useUserActions({
    hasToken: true,
    limit: limit,
    page: currentPage,
    fullName: searchQuery,
    role: roleFilter,
  });

  // 3. EFFECTS
  useEffect(() => {
    getAllStaffs();
  }, [searchQuery, verifyFilter, roleFilter, currentPage, getAllStaffs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter]);
  const [isVisualLoading, setIsVisualLoading] = useState(true);
  useEffect(() => {
    if (isLoadingStaffOnly) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingStaffOnly]);
  const handleReset = () => {
    setSearchQuery("");
    setVerifyFilter("all");
    setRoleFilter("");
    setCurrentPage(1);
  };
  const handleFilterChange = () => {
    setCurrentPage(1);
  };
  return (
    <StaffClient
      data={{
        staffOnly,
        isVisualLoading,
      }}
      filters={{
        searchQuery,
        verifyFilter,
        roleFilter,
        currentPage,
      }}
      actions={{
        setSearchQuery,
        setVerifyFilter,
        setRoleFilter,
        setCurrentPage,
        handleReset,
        handleFilterChange,
      }}
    />
  );
}