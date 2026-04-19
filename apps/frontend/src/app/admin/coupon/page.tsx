"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { TableSkeleton } from "@/components/table-skeleton";
import { useCoupon } from "@/hooks/use-coupon";
import { couponColumns } from "@/columns/coupon-column";
import { CouponStatsView } from "./components/CouponStatsView"; // Component thống kê

export default function CouponPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  
  const {
    dataCoupons, isLoadingCoupons, getCoupons,
    dataCouponStats, getCouponStats // Thêm hook gọi stats
  } = useCoupon({ hasToken: true, pageSize: 10, page: page });

  useEffect(() => {
    getCoupons();
    getCouponStats(); // Gọi luôn khi trang load
  }, [page, getCoupons, getCouponStats]);

  return (
    <div className="space-y-8">
      {/* 1. Tiêu đề và Thêm mới */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Coupon & Thống kê</h1>
        <Button onClick={() => router.push("/admin/coupon/create")}>
          <Plus className="w-4 h-4 mr-2" /> Thêm Coupon
        </Button>
      </div>

      {/* 2. Phần Thống kê (Hiện ngay trên đầu) */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Tổng quan thống kê</h2>
        <CouponStatsView data={dataCouponStats} />
      </div>

      {/* 3. Phần Danh sách Coupon */}
      <div className="min-h-[500px]">
        <h2 className="text-xl font-semibold mb-4">Danh sách Coupon</h2>
        {isLoadingCoupons ? (
          <TableSkeleton />
        ) : (
          <>
            <DataTable
              columns={couponColumns({
                onView: ({ id }) => router.push(`/admin/coupons/detail/${id}`),
                onEdit: ({ id }) => router.push(`/admin/coupons/edit/${id}`),
              })}
              data={dataCoupons?.data || []}
            />
            <div className="pt-3">
              <PaginationDemo
                currentPage={dataCoupons?.pagination?.page ?? 1}
                onPageChange={setPage}
                totalPages={dataCoupons?.pagination?.totalPages ?? 1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}