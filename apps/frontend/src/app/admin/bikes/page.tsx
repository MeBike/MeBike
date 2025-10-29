"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Bike, BikeStatus } from "@custom-types";
import { Plus } from "lucide-react";
import { useBikeActions } from "@/hooks/useBikeAction";
import { Loader2 } from "lucide-react";
import { bikeColumn } from "@/columns/bike-colums";
import { DataTable } from "@/components/TableCustom";
import { PaginationDemo } from "@/components/PaginationCustomer";
import { useStationActions } from "@/hooks/useStationAction";
import { useSupplierActions } from "@/hooks/useSupplierAction";
const mockBikes: Bike[] = [
  {
    _id: "bike_001",
    station_id: "station_001",
    status: "CÓ SẴN",
    supplier_id: "supplier_001",
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    chip_id: "CHIP_001",
  },
  {
    _id: "bike_002",
    station_id: "station_001",
    status: "ĐANG ĐƯỢC THUÊ",
    supplier_id: "supplier_001",
    created_at: "2024-01-16T00:00:00Z",
    updated_at: "2024-01-16T00:00:00Z",
    chip_id: "CHIP_002",
  },
  {
    _id: "bike_003",
    station_id: "station_002",
    status: "BỊ HỎNG",
    supplier_id: "supplier_002",
    created_at: "2024-01-17T00:00:00Z",
    updated_at: "2024-01-17T00:00:00Z",
    chip_id: "CHIP_003",
  },
  {
    _id: "bike_004",
    station_id: "station_002",
    status: "ĐANG BẢO TRÌ",
    supplier_id: "supplier_001",
    created_at: "2024-01-18T00:00:00Z",
    updated_at: "2024-01-18T00:00:00Z",
    chip_id: "CHIP_004",
  },
  {
    _id: "bike_005",
    station_id: "station_003",
    status: "CÓ SẴN",
    supplier_id: "supplier_002",
    created_at: "2024-01-19T00:00:00Z",
    updated_at: "2024-01-19T00:00:00Z",
    chip_id: "CHIP_005",
  },
];
export const getStatusColor = (status: BikeStatus) => {
  switch (status) {
    case "ĐANG ĐƯỢC THUÊ":
      return "bg-yellow-100 text-yellow-800";
    case "ĐANG BẢO TRÌ":
      return "bg-blue-100 text-blue-800";
    case "BỊ HỎNG":
      return "bg-red-100 text-red-800";
    case "CÓ SẴN":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function BikesPage() {
  const [id, setId] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit,] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BikeStatus | "all">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBike, setNewBike] = useState({
    station_id: "",
    supplier_id: "",
    chip_id: "",
    status: "CÓ SẴN" as BikeStatus,
  });
  const { stations } = useStationActions({ hasToken: true });
  const { allSupplier } = useSupplierActions(true);
  const {
    data,
    detailBike,
    getStatisticsBike,
    statisticData,
    isLoadingStatistics,
    paginationOfBikes,
    paginationBikes,
    createBike,
  } = useBikeActions(
    true,
    id,
    undefined,
    undefined,
    statusFilter !== "all" ? (statusFilter as BikeStatus) : undefined,
    limit,
    page
  );

  const filteredBikes = mockBikes.filter((bike) => {
    const matchesSearch =
      bike._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bike.chip_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || bike.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const handleViewDetails = (bikeId: string) => {
    setId(bikeId);
    setIsDetailModalOpen(true);
  }
  const handleCreateBike = () => {
    if (!newBike.station_id || !newBike.chip_id) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    createBike({
      station_id: newBike.station_id,
      supplier_id: newBike.supplier_id,
      status: newBike.status,
      chip_id: newBike.chip_id,
    });
    setIsCreateModalOpen(false);
    setNewBike({
      station_id: "",
      supplier_id: "",
      chip_id: "",
      status: "CÓ SẴN",
    });
  };
  useEffect(() => {
    getStatisticsBike();
  }, []);
  useEffect(() => {
    console.log("Bike data:", data)
  }, [data]);
  if (isLoadingStatistics) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
        <Loader2 className="animate-spin w-16 h-16 text-primary" />
      </div>
    );
  }
  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
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
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm xe mới
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Tổng số xe</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {paginationOfBikes?.totalRecords || ""}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Có sẵn</p>
            <p className="text-2xl font-bold text-green-500 mt-1">
              {statisticData?.result["CÓ SẴN"] || ""}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Đang thuê</p>
            <p className="text-2xl font-bold text-blue-500 mt-1">
              {statisticData?.result["ĐANG ĐƯỢC THUÊ"] || ""}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Bị hỏng</p>
            <p className="text-2xl font-bold text-red-500 mt-1">
              {statisticData?.result["BỊ HỎNG"] || "0"}
            </p>
          </div>
          {/* <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Bảo trì</p>
            <p className="text-2xl font-bold text-orange-500 mt-1">
              {stats.maintenance}
            </p>
          </div> */}
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm theo ID xe hoặc Chip ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground"
            />
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

        {/* Table */}
        <div className="w-full rounded-lg space-y-4  flex flex-col">
          <DataTable
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

        {/* Results info */}
        <p className="text-sm text-muted-foreground">
          Hiển thị {filteredBikes.length} / {mockBikes.length} xe đạp
        </p>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Thêm xe đạp mới
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Trạm xe
                </label>
                <select
                  value={newBike.station_id}
                  onChange={(e) =>
                    setNewBike({ ...newBike, station_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                >
                  <option value="">Chọn trạm xe</option>
                  {stations.map((station) => (
                    <option key={station._id} value={station._id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Nhà cung cấp
                </label>
                <select
                  value={newBike.supplier_id}
                  onChange={(e) =>
                    setNewBike({ ...newBike, supplier_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                >
                  <option value="">Chọn nhà cung cấp</option>
                  {allSupplier?.data.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Chip ID
                </label>
                <input
                  type="text"
                  value={newBike.chip_id}
                  onChange={(e) =>
                    setNewBike({ ...newBike, chip_id: e.target.value })
                  }
                  placeholder="Nhập Chip ID"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">
                  Trạng thái
                </label>
                <select
                  value={newBike.status}
                  onChange={(e) =>
                    setNewBike({
                      ...newBike,
                      status: e.target.value as BikeStatus,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                >
                  <option value="CÓ SẴN">Có sẵn</option>
                  <option value="ĐANG ĐƯỢC THUÊ">Đang được thuê</option>
                  <option value="BỊ HỎNG">Bị hỏng</option>
                  <option value="ĐANG BẢO TRÌ">Đang bảo trì</option>
                  <option value="KHÔNG CÓ SẴN">Không có sẵn</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button onClick={handleCreateBike} className="flex-1">
                Thêm xe đạp
              </Button>
            </div>
          </div>
        </div>
      )}
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
