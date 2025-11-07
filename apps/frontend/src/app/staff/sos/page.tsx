"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { DataTable } from "@/components/TableCustom";
import { Button } from "@/components/ui/button";
import { PaginationDemo } from "@/components/PaginationCustomer";
import type { SOS } from "@/types/SOS";
import { useSOS } from "@/hooks/use-sos";
import { sosColumns } from "@/columns/sos-columns";
export default function SOSPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    SOS["status"] | "all"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState<number>(10);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"info" | "details" | "notes">("info");
  const [selectedSOSId, setSelectedSOSId] = useState<string>("");

  const {
    sosRequests,
    isLoading,
    refetchSOSRequest,
    sosDetail,
    isLoadingSOSDetail,
    refetchSOSDetail,
  } = useSOS({
    hasToken: true,
    page: currentPage,
    limit: limit,
    id: selectedSOSId,
  });

  useEffect(() => {
    refetchSOSRequest();
  }, [currentPage, statusFilter, searchQuery, refetchSOSRequest]);

  useEffect(() => {
    if (selectedSOSId) {
      refetchSOSDetail();
    }
  }, [selectedSOSId, refetchSOSDetail]);

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  if (isLoading && currentPage === 1) {
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
              Quản lý yêu cầu cứu hộ
            </h1>
            <p className="text-muted-foreground mt-1">
              Theo dõi và quản lý các yêu cầu cứu hộ từ người dùng
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Bộ lọc</h3>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Xóa bộ lọc
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm</label>
              <input
                type="text"
                placeholder="Mã yêu cầu, mã người dùng, mã xe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(
                    e.target.value as SOS["status"] | "all"
                  );
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">Tất cả</option>
                <option value="ĐANG CHỜ XỬ LÍ">Đang chờ xử lý</option>
                <option value="ĐÃ XỬ LÍ">Đã xử lý</option>
                <option value="KHÔNG XỬ LÍ ĐƯỢC">Không xử lý được</option>
                <option value="ĐÃ TỪ CHỐI">Đã từ chối</option>
              </select>
            </div>
          </div>
        </div>

        {/* SOS Requests Table */}
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Hiển thị trang {currentPage}
          </p>

          {sosRequests?.data && sosRequests.data.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">Không có yêu cầu cứu hộ</p>
              <p className="text-sm text-muted-foreground mt-1">
                Không tìm thấy yêu cầu cứu hộ nào phù hợp với bộ lọc
              </p>
            </div>
          ) : (
            <>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <DataTable
                  columns={sosColumns({
                    onView: (sos: SOS) => {
                      setSelectedSOSId(sos._id);
                      setIsDetailModalOpen(true);
                    },
                  })}
                  data={sosRequests?.data || []}
                />
              </div>

              <div className="pt-3">
                <PaginationDemo
                  currentPage={currentPage}
                  totalPages={1}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail SOS Modal */}
      {isDetailModalOpen && sosDetail?.result && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                Chi tiết yêu cầu cứu hộ
              </h2>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedSOSId("");
                  setDetailTab("info");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {!sosDetail?.result ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
              </div>
            ) : (
              <>
                {/* Tabs for different sections */}
                <div className="flex gap-2 mb-6 border-b border-border">
                  <button
                    onClick={() => setDetailTab("info")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      detailTab === "info"
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Thông tin
                  </button>
                  <button
                    onClick={() => setDetailTab("details")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      detailTab === "details"
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Chi tiết vấn đề
                  </button>
                  <button
                    onClick={() => setDetailTab("notes")}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      detailTab === "notes"
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Ghi chú xử lý
                  </button>
                </div>

                {/* Tab: Info */}
                {detailTab === "info" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Mã yêu cầu cứu hộ</p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result._id}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Mã yêu cầu (requester)</p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.requester_id}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Mã xe đạp</p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.bike_id}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Mã nhân viên SOS</p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.sos_agent_id || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Mã nhân viên</p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.staff_id || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Trạng thái</p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          sosDetail.result.status === "ĐÃ XỬ LÍ"
                            ? "bg-green-100 text-green-800"
                            : sosDetail.result.status === "ĐANG CHỜ XỬ LÍ"
                              ? "bg-yellow-100 text-yellow-800"
                              : sosDetail.result.status === "KHÔNG XỬ LÍ ĐƯỢC"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {sosDetail.result.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Ngày tạo</p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.created_at
                          ? new Date(sosDetail.result.created_at).toLocaleString("vi-VN")
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Lần cập nhật cuối</p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.updated_at
                          ? new Date(sosDetail.result.updated_at).toLocaleString("vi-VN")
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Thời gian xử lý</p>
                      <p className="text-foreground font-medium">
                        {sosDetail.result.resolved_at
                          ? new Date(sosDetail.result.resolved_at).toLocaleString("vi-VN")
                          : "-"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab: Details */}
                {detailTab === "details" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Mô tả vấn đề</p>
                      <p className="text-foreground bg-muted rounded-lg p-3">
                        {sosDetail.result.issue}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Vị trí</p>
                      <p className="text-foreground text-sm">
                        {sosDetail.result.location && sosDetail.result.location.coordinates
                          ? `Tọa độ: ${sosDetail.result.location.coordinates[0]}, ${sosDetail.result.location.coordinates[1]}`
                          : "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Hình ảnh</p>
                      {sosDetail.result.photo && sosDetail.result.photo.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {sosDetail.result.photo.map((photo, idx) => (
                            <div key={idx} className="bg-muted rounded-lg p-2 text-xs text-center">
                              <p className="truncate">{photo.slice(0, 30)}...</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Không có hình ảnh</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Notes */}
                {detailTab === "notes" && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Ghi chú xử lý</p>
                      <p className="text-foreground bg-muted rounded-lg p-3">
                        {sosDetail.result.agent_notes || "Chưa có ghi chú"}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedSOSId("");
                  setDetailTab("info");
                }}
                className="flex-1"
              >
                Đóng
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled
              >
                Xử lý yêu cầu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
