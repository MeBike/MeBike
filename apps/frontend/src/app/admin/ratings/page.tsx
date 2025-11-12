"use client";
import { useState, useEffect } from "react";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { ratingColumn } from "@/columns/rating-columns";
import { ratingService } from "@/services/rating.service";
import { RatingDetailModal } from "@/components/rating-detail-modal";
import type { Rating } from "@/types";

export default function RatingsPage() {
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedRatingId, setSelectedRatingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setLoading(true);
        const response = await ratingService.getAllRatings({ page, limit });
        setRatings(response.data.data);
        setPagination(response.data.pagination);
      } catch (error) {
        console.error("Error fetching ratings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [page, limit]);

  const handleView = ({ id }: { id: string }) => {
    setSelectedRatingId(id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRatingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Quản lý đánh giá
        </h1>
        <p className="text-muted-foreground mt-1">
          Theo dõi và quản lý các đánh giá từ người dùng
        </p>
      </div>

      {/* Table */}
      <div className="w-full rounded-lg space-y-4 flex flex-col">
        <DataTable
          columns={ratingColumn({
            onView: handleView,
          })}
          data={ratings}
        />
        <PaginationDemo
          currentPage={pagination.currentPage}
          onPageChange={setPage}
          totalPages={pagination.totalPages}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Trang {pagination.currentPage} / {pagination.totalPages} ({pagination.totalRecords} đánh giá)
      </p>

      {/* Rating Detail Modal */}
      {selectedRatingId && (
        <RatingDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          ratingId={selectedRatingId}
        />
      )}
    </div>
  );
}