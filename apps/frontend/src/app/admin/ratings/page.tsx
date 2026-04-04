"use client";
import { useState, useEffect } from "react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { ratingColumn } from "@/columns/rating-columns";
import { ratingService } from "@/services/rating.service";
import { RatingDetailModal } from "@/components/rating-detail-modal";
import type { Rating } from "@/types";
import { useRatingAction } from "@/hooks/use-rating";
import { TableSkeleton } from "@/components/table-skeleton";
export default function RatingsPage() {
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [selectedRatingId, setSelectedRatingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    ratings,
    ratingDetail,
    isLoadingRatingDetail,
    isLoadingRatings,
    getRating,
  } = useRatingAction({ hasToken: true, page: page, pageSize: pageSize });
  const [isVisualLoading, setIsVisualLoading] = useState<boolean>(false);
  const handleView = ({ id }: { id: string }) => {
    setSelectedRatingId(id);
    setIsModalOpen(true);
  };
  useEffect(() => {
    getRating();
  }, [page]);
  useEffect(() => {
    if (isLoadingRatings) {
      setIsVisualLoading(true);
    } else {
      const timer = setTimeout(() => {
        setIsVisualLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoadingRatings]);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRatingId(null);
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Quản lý đánh giá</h1>
        <p className="text-muted-foreground mt-1">
          Theo dõi và quản lý các đánh giá từ người dùng
        </p>
      </div>
      <div className="w-full rounded-lg space-y-4 flex flex-col">
        {isVisualLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <DataTable
              columns={ratingColumn({
                onView: handleView,
              })}
              data={ratings?.data ?? []}
            />
            <div className="pt-3">
              <PaginationDemo
                currentPage={ratings?.pagination.page ?? 1}
                onPageChange={setPage}
                totalPages={ratings?.pagination.totalPages ?? 1}
              />
            </div>
          </>
        )}
      </div>
      {/* {selectedRatingId && (
        <RatingDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          ratingId={selectedRatingId}
        />
      )} */}
    </div>
  );
}
