"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { TableSkeleton } from "@/components/table-skeleton";
import { useCoupon } from "@/hooks/use-coupon"; // Giả định tên hook của bạn
import { couponColumns } from "@/columns/coupon-column"; // Bạn cần tạo file này

export default function CouponPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  
  const {
    dataCoupons,
    isLoadingCoupons,
    getCoupons,
  } = useCoupon({
    hasToken: true,
    pageSize: 10,
    page: page,
  });

  useEffect(() => {
    getCoupons();
  }, [page, getCoupons]);

  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  useEffect(() => {
    if (isLoadingCoupons) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => setIsVisualLoading(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingCoupons]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Coupon</h1>
        <Button onClick={() => router.push("/admin/coupons/create")}>
          <Plus className="w-4 h-4 mr-2" /> Thêm Coupon
        </Button>
      </div>

      <div className="min-h-[700px]">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Trang {dataCoupons?.pagination?.page ?? 1} /{" "}
              {dataCoupons?.pagination?.totalPages ?? 1}
            </p>
            
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