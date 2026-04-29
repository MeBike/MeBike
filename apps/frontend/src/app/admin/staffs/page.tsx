"use client";

import { useEffect, useState } from "react";
import StaffClient from "./StaffClient";
import { useUserActions } from "@/hooks/use-user";
import type { VerifyStatus, UserRole } from "@custom-types";
import { LoadingScreen } from "@/components/loading-screen/loading-screen";
export type UserStatusFilter = VerifyStatus | "BANNED" | "";

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyFilter, setVerifyFilter] = useState<UserStatusFilter>("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 7;
  const { staffOnly, isLoadingStaffOnly, getAllStaffs } = useUserActions({
    hasToken: true,
    limit: limit,
    page: currentPage,
    fullName: searchQuery,
    verify:verifyFilter,
    role:roleFilter,
  });

  useEffect(() => {
    getAllStaffs();
  }, [searchQuery, verifyFilter, roleFilter, currentPage, getAllStaffs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter]);
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(true);

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
  if (isVisualLoading) {
    return <LoadingScreen />;
  }
  if (!staffOnly) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-muted-foreground">
          Không tìm thấy thông tin các nhân viên.
        </p>
      </div>
    );
  }
  const handleReset = () => {
    setSearchQuery("");
    setVerifyFilter("");
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
