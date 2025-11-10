"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { BikeStatus } from "@custom-types";
import { useBikeActions } from "@/hooks/useBikeAction";
import { Loader2 } from "lucide-react";
import { bikeColumn } from "@/columns/bike-colums";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { getStatusColor } from "@/utils/bike-status";

export default function BikesPage() {
  const [id, setId] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BikeStatus | "all">("all");
  const {
    data,
    detailBike,
    paginationBikes,
    getBikeByID,
    isLoadingDetail,
  } = useBikeActions(
    true,
    id,
    undefined,
    undefined,
    statusFilter !== "all" ? (statusFilter as BikeStatus) : undefined,
    limit,
    page
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const handleViewDetails = (bikeId: string) => {
    setId(bikeId);
    setIsDetailModalOpen(true);
  };
  useEffect(() => {
    getBikeByID();
  }, [id, getBikeByID]);
  if (isLoadingDetail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="animate-spin w-16 h-16 text-primary" />
      </div>
    );
  }
  return (
    <div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý xe đạp
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý danh sách xe đạp băng chân
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button> */}
            {/* <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm xe mới
            </Button> */}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as BikeStatus | "all")
              }
              className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="CÓ SẴN">Có sẵn</option>
              <option value="ĐANG ĐƯỢC THUÊ">Đang được thuê</option>
              <option value="BỊ HỎNG">Bị hỏng</option>
              <option value="ĐÃ ĐẶT TRƯỚC">Đã đặt trước</option>
              <option value="ĐANG BẢO TRÌ">Đang bảo trì</option>
              <option value="KHÔNG CÓ SẴN">Không có sẵn</option>
            </select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              Đặt lại
            </Button>
          </div>
        </div>
        <div className="w-full rounded-lg space-y-4  flex flex-col">
          <DataTable
            title="Danh sách xe"
            columns={bikeColumn({
              onView: ({ id }: { id: string }) => {
                handleViewDetails(id);
              },
            })}
            data={data?.data || []}
          />
          <PaginationDemo
            currentPage={paginationBikes?.currentPage ?? 1}
            onPageChange={setPage}
            totalPages={paginationBikes?.totalPages ?? 1}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          Trang {paginationBikes?.currentPage} / {paginationBikes?.totalPages}{" "}
          xe đạp
        </p>
      </div>
      {isDetailModalOpen && detailBike && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Chi tiết xe đạp
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">ID Xe</p>
                <p className="text-foreground font-medium">{detailBike._id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chip ID</p>
                <p className="text-foreground font-medium">
                  {detailBike.chip_id}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trạm</p>
                <p className="text-foreground font-medium">
                  {detailBike.station_id}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nhà cung cấp</p>
                <p className="text-foreground font-medium">
                  {detailBike.supplier_id || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trạng thái</p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(detailBike.status)}`}
                >
                  {detailBike.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ngày tạo</p>
                <p className="text-foreground font-medium">
                  {new Date(detailBike.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ngày cập nhật</p>
                <p className="text-foreground font-medium">
                  {new Date(detailBike.updated_at).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsDetailModalOpen(false)}
              className="w-full mt-6"
            >
              Đóng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
