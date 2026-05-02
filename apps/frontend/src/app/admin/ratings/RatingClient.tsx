"use client";

import { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { ratingColumn } from "@/columns/rating-columns";
import { TableSkeleton } from "@/components/table-skeleton";
import type { Rating , Pagination } from "@/types";
interface RatingClientProps {
  data: {
    ratings: Rating[];
    pagination?: Pagination;
    isVisualLoading: boolean;
  };
  filters: {
    page: number;
  };
  actions: {
    setPage: Dispatch<SetStateAction<number>>;
  };
}

export default function RatingClient({
  data: { ratings, pagination, isVisualLoading },
  filters: { page },
  actions: { setPage },
}: RatingClientProps) {
  const router = useRouter();

  const handleView = ({ id }: { id: string }) => {
    router.push(`/admin/ratings/detail/${id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Quản lý đánh giá</h1>
        <p className="mt-1 text-muted-foreground">
          Theo dõi và quản lý các đánh giá từ người dùng
        </p>
      </div>
      
      <div className="flex w-full flex-col space-y-4 rounded-lg">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Hiển thị trang {page} / {pagination?.totalPages ?? 1}
              </p>
            </div>
            <DataTable
              columns={ratingColumn({
                onView: (rating) => handleView({ id: rating.id }),
              })}
              data={ratings}
            />
            
            <div className="pt-3">
              <PaginationDemo
                currentPage={pagination?.page ?? 1}
                onPageChange={setPage}
                totalPages={pagination?.totalPages ?? 1}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}