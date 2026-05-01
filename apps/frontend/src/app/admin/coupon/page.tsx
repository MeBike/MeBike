"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Table as TableIcon, History } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { TableSkeleton } from "@/components/table-skeleton";
import { useCoupon } from "@/hooks/use-coupon";
import { couponColumns } from "@/columns/coupon-column";
import { couponUsageLogColumns } from "@/columns/coupon-usage-column";
import { CouponStatsView } from "./components/CouponStatsView";

export default function CouponPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  
  const {
    dataCoupons, isLoadingCoupons, getCoupons,
    dataCouponStats, getCouponStats, activeCoupon, deactiveCoupon,
    dataUsageCouponLog, isLoadingUsageCouponLog, getUsageCouponLog 
  } = useCoupon({ hasToken: true, pageSize: 10, page: page });

  useEffect(() => {
    getCoupons();
    getCouponStats();
    getUsageCouponLog();
  }, [page, getCoupons, getCouponStats, getUsageCouponLog]);

  return (
    <div className="space-y-10">
      {/* 1. Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Coupon & Thống kê</h1>
        <Button onClick={() => router.push("/admin/coupon/create")}>
          <Plus className="w-4 h-4 mr-2" /> Thêm Coupon
        </Button>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Tổng quan thống kê</h2>
        <CouponStatsView data={dataCouponStats} />
      </div>
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TableIcon className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Danh sách Coupon</h2>
        </div>
        {isLoadingCoupons ? <TableSkeleton /> : (
          <div className="bg-white rounded-xl border p-2">
            <DataTable
              columns={couponColumns({
                onView: ({ id }) => router.push(`/admin/coupon/detail/${id}`),
                onActive: ({ id }) => activeCoupon(id),
                onDeactive: ({ id }) => deactiveCoupon(id),
              })}
              data={dataCoupons?.data || []}
            />
            <div className="mt-4">
              <PaginationDemo
                currentPage={dataCoupons?.pagination?.page ?? 1}
                onPageChange={setPage}
                totalPages={dataCoupons?.pagination?.totalPages ?? 1}
              />
            </div>
          </div>
        )}
      </section>

      {/* 4. Lịch sử sử dụng */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Lịch sử sử dụng Coupon</h2>
        </div>
        {isLoadingUsageCouponLog ? <TableSkeleton /> : (
          <div className="bg-white rounded-xl border p-2">
            <DataTable
              columns={couponUsageLogColumns({
                onView: (log) => router.push(`/admin/coupon/usage/${log.rentalId}`),
              })}
              data={dataUsageCouponLog?.data || []}
            />
            <div className="mt-4">
              <PaginationDemo
                currentPage={dataUsageCouponLog?.pagination?.page ?? 1}
                onPageChange={setPage}
                totalPages={dataUsageCouponLog?.pagination?.totalPages ?? 1}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}